/**
 * PodPick — Weekly pitch plan generator
 *
 * Runs every Monday morning per active client. Uses the send strategy to
 * determine how many pitches need to go out this week (and at what Step 1/2 ratio),
 * then triggers the agent to generate + queue them for VA review.
 *
 * Cadence per send-strategy doc:
 *   Standard: 3-3-2-2 across weeks 1-4 of the billing period
 *   Pro: 7-7-6-5 across weeks 1-4
 *
 * The actual generation is async — this function just plans + emits events.
 */

import { inngest } from '../client';
import { db } from '@/db';
import { clientProfiles, subscriptions, sendSchedules } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Cadence definitions — pitches per week of the billing period
const STANDARD_WEEKLY = [3, 3, 2, 2];   // total 10
const PRO_WEEKLY = [7, 7, 6, 5];         // total 25
const STANDARD_WEEKLY_WARMUP = [2, 2, 3, 3];  // ramps up gradually for new domains
const PRO_WEEKLY_WARMUP = [4, 4, 7, 7];

// Cron: every Monday at 6am UTC
export const weeklyPitchPlan = inngest.createFunction(
  {
    id: 'weekly-pitch-plan',
    name: 'Weekly: pitch plan generator',
  },
  { cron: '0 6 * * 1' },  // Monday 06:00 UTC
  async ({ step }) => {
    // Load all active clients (trialing + active)
    const activeClients = await step.run('load-active-clients', async () =>
      db.query.clientProfiles.findMany({
        where: and(
          eq(clientProfiles.status, 'active'),
        ),
      })
    );

    const trialingClients = await step.run('load-trialing-clients', async () =>
      db.query.clientProfiles.findMany({
        where: and(
          eq(clientProfiles.status, 'trialing'),
        ),
      })
    );

    const allActive = [...activeClients, ...trialingClients];

    for (const client of allActive) {
      await step.sendEvent(`plan-${client.id}`, {
        name: 'client.weekly_plan_due',
        data: { clientProfileId: client.id },
      });
    }

    return { clientsScheduled: allActive.length };
  }
);

// Per-client planning — generates the week's pitch slots
export const planWeekForClient = inngest.createFunction(
  { id: 'plan-week-for-client', name: 'Weekly: plan week for client' },
  { event: 'client.weekly_plan_due' },
  async ({ event, step }) => {
    const { clientProfileId } = event.data;

    // Load subscription + determine week-of-period
    const sub = await step.run('load-sub', async () =>
      db.query.subscriptions.findFirst({
        where: eq(subscriptions.clientProfileId, clientProfileId),
      })
    );

    if (!sub || (sub.status !== 'active' && sub.status !== 'trialing')) {
      return { skipped: 'subscription_not_active' };
    }

    const client = await step.run('load-client', async () =>
      db.query.clientProfiles.findFirst({
        where: eq(clientProfiles.id, clientProfileId),
      })
    );

    if (!client?.intakeCompletedAt) {
      return { skipped: 'intake_not_done' };
    }

    // Respect a VA's manual override: if they've taken the wheel for this period,
    // the auto-planner stays out of the way and does not regenerate slots.
    const manualOverride = await step.run('check-manual-override', async () => {
      const sched = await db.query.sendSchedules.findFirst({
        where: and(
          eq(sendSchedules.clientProfileId, clientProfileId),
          eq(sendSchedules.periodStart, new Date(sub.currentPeriodStart!))
        ),
      });
      return !!sched?.manualOverride;
    });
    if (manualOverride) {
      return { skipped: 'manual_override' };
    }

    // Compute which week of the billing period we're in
    const weekOfPeriod = computeWeekOfPeriod(sub.currentPeriodStart!);

    // Determine cadence
    const cadence =
      sub.tier === 'pro'
        ? client.newSendingDomain
          ? PRO_WEEKLY_WARMUP
          : PRO_WEEKLY
        : client.newSendingDomain
          ? STANDARD_WEEKLY_WARMUP
          : STANDARD_WEEKLY;

    const targetThisWeek = cadence[Math.min(weekOfPeriod - 1, cadence.length - 1)] || 0;

    if (targetThisWeek === 0) {
      return { skipped: 'no_pitches_this_week' };
    }

    // Determine Step 1 vs Step 2 mix
    // Month 1 (weekOfPeriod 1-4 of first period) = 100% Step 1
    // Month 2+ = 70% Step 1 / 30% Step 2
    const isMonth1 = await step.run('check-is-month-1', async () =>
      isClientInFirstPeriod(clientProfileId)
    );

    const step1Count = isMonth1 ? targetThisWeek : Math.round(targetThisWeek * 0.7);
    const step2Count = targetThisWeek - step1Count;

    // Update or create send_schedule for this period
    await step.run('upsert-send-schedule', async () =>
      upsertSendSchedule({
        clientProfileId,
        periodStart: new Date(sub.currentPeriodStart!),
        periodEnd: new Date(sub.currentPeriodEnd!),
        weekOfPeriod,
        targetThisWeek,
        step1Count,
        step2Count,
        warmupMode: !!client.newSendingDomain,
      })
    );

    // The VA is notified via dashboard — they'll prompt the agent to generate pitches
    // when they review their queue Monday morning. We don't auto-generate without VA initiation.

    return {
      planned: true,
      weekOfPeriod,
      step1Count,
      step2Count,
      warmupMode: !!client.newSendingDomain,
    };
  }
);

// ───────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────

function computeWeekOfPeriod(periodStart: Date | string): number {
  const start = new Date(periodStart);
  const daysSinceStart = Math.floor(
    (Date.now() - start.getTime()) / (24 * 60 * 60 * 1000)
  );
  return Math.min(Math.floor(daysSinceStart / 7) + 1, 4);
}

async function isClientInFirstPeriod(clientProfileId: string): Promise<boolean> {
  const client = await db.query.clientProfiles.findFirst({
    where: eq(clientProfiles.id, clientProfileId),
  });
  if (!client?.intakeCompletedAt) return true;

  const daysActive = Math.floor(
    (Date.now() - new Date(client.intakeCompletedAt).getTime()) / (24 * 60 * 60 * 1000)
  );
  return daysActive < 30;
}

async function upsertSendSchedule(params: {
  clientProfileId: string;
  periodStart: Date;
  periodEnd: Date;
  weekOfPeriod: number;
  targetThisWeek: number;
  step1Count: number;
  step2Count: number;
  warmupMode: boolean;
}): Promise<void> {
  // Implementation: insert or update sendSchedules row, append week's planned slots
  // Full implementation in week 6 of build plan
  await db.insert(sendSchedules).values({
    clientProfileId: params.clientProfileId,
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    plannedSends: Array.from({ length: params.targetThisWeek }, (_, i) => ({
      scheduledFor: new Date(
        Date.now() + (i + 1) * 24 * 60 * 60 * 1000
      ).toISOString(),
      slotType: i < params.step1Count ? 'step1' : 'step2' as const,
      weekNumber: params.weekOfPeriod as 1 | 2 | 3 | 4,
    })),
    warmupMode: params.warmupMode,
  }).onConflictDoUpdate({
    target: [sendSchedules.clientProfileId, sendSchedules.periodStart],
    set: {
      updatedAt: new Date(),
    },
  });
}

export const WEEKLY_PLAN_FUNCTIONS = [weeklyPitchPlan, planWeekForClient];
