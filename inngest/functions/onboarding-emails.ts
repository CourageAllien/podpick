/**
 * PodPick — Onboarding email sequence orchestration via Inngest
 *
 * The 9 trial emails fire on state changes + scheduled delays:
 *
 *   client.signup              → welcome immediately
 *                              → intake_nudge at +6h if intake not done
 *                              → intake_reminder at +24h if intake not done
 *                              → trial_day_5 fires (scheduled at signup + 5d)
 *                              → trial_day_6 fires (scheduled at signup + 6d)
 *
 *   client.intake_completed    → researching immediately
 *
 *   client.first_pitches_sent  → first_pitches_sent immediately
 *
 *   client.trial_day_5         → mid_trial_checkin
 *
 *   client.trial_day_6         → trial_converting_tomorrow
 *
 *   client.subscription_renewed → welcome_paid
 *
 *   client.subscription_canceled → trial_ended_canceled
 *                                → winback_30 at +30d
 *                                → winback_60 at +60d
 *                                → winback_90 at +90d
 *
 *   client.first_month_complete → first_month_milestone
 */

import { inngest } from '../client';
import { sendOnboardingEmail } from '@/lib/resend';
import { db } from '@/db';
import { clientProfiles, subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';

// ───────────────────────────────────────────────────────────────
// SIGNUP — kicks off the whole sequence
// ───────────────────────────────────────────────────────────────

export const onSignup = inngest.createFunction(
  { id: 'onboarding-on-signup', name: 'Onboarding: on signup' },
  { event: 'client.signup' },
  async ({ event, step }) => {
    const { clientProfileId } = event.data;

    // Email 1: Welcome (immediate)
    await step.run('send-welcome', async () =>
      sendOnboardingEmail({ clientProfileId, template: 'welcome' })
    );

    // Email 2: Intake nudge (6h if not done)
    await step.sleep('wait-6h', '6h');
    const after6h = await step.run('check-intake-after-6h', async () => {
      const client = await db.query.clientProfiles.findFirst({
        where: eq(clientProfiles.id, clientProfileId),
      });
      return { intakeDone: !!client?.intakeCompletedAt };
    });

    if (!after6h.intakeDone) {
      await step.run('send-intake-nudge', async () =>
        sendOnboardingEmail({ clientProfileId, template: 'intake_nudge' })
      );
    }

    // Email 3: Intake reminder (24h if not done)
    await step.sleep('wait-to-24h', '18h');  // 6h + 18h = 24h total
    const after24h = await step.run('check-intake-after-24h', async () => {
      const client = await db.query.clientProfiles.findFirst({
        where: eq(clientProfiles.id, clientProfileId),
      });
      return { intakeDone: !!client?.intakeCompletedAt };
    });

    if (!after24h.intakeDone) {
      await step.run('send-intake-reminder', async () =>
        sendOnboardingEmail({ clientProfileId, template: 'intake_reminder' })
      );
    }

    // Schedule day 5 + day 6 checks
    await step.sendEvent('schedule-day-5', {
      name: 'client.trial_day_5',
      data: { clientProfileId },
      ts: Date.now() + 5 * 24 * 60 * 60 * 1000,
    });
    await step.sendEvent('schedule-day-6', {
      name: 'client.trial_day_6',
      data: { clientProfileId },
      ts: Date.now() + 6 * 24 * 60 * 60 * 1000,
    });
  }
);

// ───────────────────────────────────────────────────────────────
// INTAKE COMPLETED → researching email
// ───────────────────────────────────────────────────────────────

export const onIntakeCompleted = inngest.createFunction(
  { id: 'onboarding-on-intake', name: 'Onboarding: intake completed' },
  { event: 'client.intake_completed' },
  async ({ event, step }) => {
    await step.run('send-researching', async () =>
      sendOnboardingEmail({
        clientProfileId: event.data.clientProfileId,
        template: 'researching',
      })
    );
  }
);

// ───────────────────────────────────────────────────────────────
// FIRST PITCHES SENT
// ───────────────────────────────────────────────────────────────

export const onFirstPitchesSent = inngest.createFunction(
  { id: 'onboarding-on-first-pitches', name: 'Onboarding: first pitches sent' },
  { event: 'client.first_pitches_sent' },
  async ({ event, step }) => {
    await step.run('send-first-pitches', async () =>
      sendOnboardingEmail({
        clientProfileId: event.data.clientProfileId,
        template: 'first_pitches_sent',
      })
    );
  }
);

// ───────────────────────────────────────────────────────────────
// DAY 5 + DAY 6 OF TRIAL
// ───────────────────────────────────────────────────────────────

export const onTrialDay5 = inngest.createFunction(
  { id: 'onboarding-trial-day-5', name: 'Onboarding: trial day 5' },
  { event: 'client.trial_day_5' },
  async ({ event, step }) => {
    // Only send if still trialing
    const sub = await step.run('check-status', async () =>
      db.query.subscriptions.findFirst({
        where: eq(subscriptions.clientProfileId, event.data.clientProfileId),
      })
    );
    if (sub?.status === 'trialing') {
      await step.run('send-mid-trial', async () =>
        sendOnboardingEmail({
          clientProfileId: event.data.clientProfileId,
          template: 'mid_trial_checkin',
        })
      );
    }
  }
);

export const onTrialDay6 = inngest.createFunction(
  { id: 'onboarding-trial-day-6', name: 'Onboarding: trial day 6' },
  { event: 'client.trial_day_6' },
  async ({ event, step }) => {
    const sub = await step.run('check-status', async () =>
      db.query.subscriptions.findFirst({
        where: eq(subscriptions.clientProfileId, event.data.clientProfileId),
      })
    );
    if (sub?.status === 'trialing') {
      await step.run('send-converting-tomorrow', async () =>
        sendOnboardingEmail({
          clientProfileId: event.data.clientProfileId,
          template: 'trial_converting_tomorrow',
        })
      );
    }
  }
);

// ───────────────────────────────────────────────────────────────
// SUBSCRIPTION RENEWED → welcome to paid
// ───────────────────────────────────────────────────────────────

export const onSubscriptionRenewed = inngest.createFunction(
  { id: 'onboarding-subscription-renewed', name: 'Onboarding: subscription renewed' },
  { event: 'client.subscription_renewed' },
  async ({ event, step }) => {
    await step.run('send-welcome-paid', async () =>
      sendOnboardingEmail({
        clientProfileId: event.data.clientProfileId,
        template: 'welcome_paid',
      })
    );

    // Schedule 30-day milestone
    await step.sendEvent('schedule-30-day-milestone', {
      name: 'client.first_month_complete',
      data: { clientProfileId: event.data.clientProfileId },
      ts: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });
  }
);

// ───────────────────────────────────────────────────────────────
// SUBSCRIPTION CANCELED → trial ended + win-back chain
// ───────────────────────────────────────────────────────────────

export const onSubscriptionCanceled = inngest.createFunction(
  { id: 'onboarding-subscription-canceled', name: 'Onboarding: subscription canceled' },
  { event: 'client.subscription_canceled' },
  async ({ event, step }) => {
    await step.run('send-trial-ended', async () =>
      sendOnboardingEmail({
        clientProfileId: event.data.clientProfileId,
        template: 'trial_ended_canceled',
      })
    );

    // Schedule win-back at 30, 60, 90 days
    for (const days of [30, 60, 90] as const) {
      await step.sendEvent(`schedule-winback-${days}`, {
        name: 'client.winback_due',
        data: { clientProfileId: event.data.clientProfileId, stage: days },
        ts: Date.now() + days * 24 * 60 * 60 * 1000,
      });
    }
  }
);

// ───────────────────────────────────────────────────────────────
// FIRST MONTH MILESTONE
// ───────────────────────────────────────────────────────────────

export const onFirstMonthComplete = inngest.createFunction(
  { id: 'onboarding-first-month', name: 'Onboarding: first month milestone' },
  { event: 'client.first_month_complete' },
  async ({ event, step }) => {
    const sub = await step.run('check-still-active', async () =>
      db.query.subscriptions.findFirst({
        where: eq(subscriptions.clientProfileId, event.data.clientProfileId),
      })
    );
    if (sub?.status === 'active') {
      await step.run('send-milestone', async () =>
        sendOnboardingEmail({
          clientProfileId: event.data.clientProfileId,
          template: 'first_month_milestone',
        })
      );
    }
  }
);

// ───────────────────────────────────────────────────────────────
// WIN-BACK SEQUENCE
// ───────────────────────────────────────────────────────────────

export const onWinbackDue = inngest.createFunction(
  { id: 'onboarding-winback', name: 'Onboarding: winback' },
  { event: 'client.winback_due' },
  async ({ event, step }) => {
    const { clientProfileId, stage } = event.data;

    // Skip if they restarted before the winback fires
    const sub = await step.run('check-not-active', async () =>
      db.query.subscriptions.findFirst({
        where: eq(subscriptions.clientProfileId, clientProfileId),
      })
    );
    if (sub?.status === 'active' || sub?.status === 'trialing') {
      return { skipped: 'client_restarted_before_winback' };
    }

    const template =
      stage === 30 ? 'winback_30' : stage === 60 ? 'winback_60' : 'winback_90';

    await step.run('send-winback', async () =>
      sendOnboardingEmail({ clientProfileId, template })
    );
  }
);

// Export all functions for Inngest to register
export const ONBOARDING_FUNCTIONS = [
  onSignup,
  onIntakeCompleted,
  onFirstPitchesSent,
  onTrialDay5,
  onTrialDay6,
  onSubscriptionRenewed,
  onSubscriptionCanceled,
  onFirstMonthComplete,
  onWinbackDue,
];
