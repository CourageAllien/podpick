/**
 * PodPick — Send pipeline via Inngest
 *
 * Enforces send-strategy rules:
 *  - Send only Tue/Wed/Thu (no weekends, no Mondays, no Fridays)
 *  - 9am-2pm host-local timezone (default Eastern for US-heavy targeting)
 *  - 45-90 second jitter between sends in the same batch
 *  - Step 1 follow-ups fire 4-5 days after original send
 *  - New-domain warmup mode reduces volume in weeks 1-2
 *
 * Trigger flow:
 *   VA approves pitches in bulk review → pitch.queued_for_send fires →
 *   schedulePitchSend runs → pitch.scheduled fires → on schedule, sendPitch fires →
 *   Unipile sends → status updated → pitch.sent fires →
 *   4-5 days later, schedulePitchFollowup checks for reply and fires followup if silent
 */

import { inngest } from '../client';
import { sendEmail as sendViaUnipile } from '@/lib/unipile';
import { db } from '@/db';
import { pitches, sendEvents, clientProfiles, podcasts, subscriptions } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';

// ───────────────────────────────────────────────────────────────
// SCHEDULE — assign a send time respecting cadence rules
// ───────────────────────────────────────────────────────────────

export const schedulePitchSend = inngest.createFunction(
  { id: 'schedule-pitch-send', name: 'Send: schedule pitch' },
  { event: 'pitch.queued_for_send' },
  async ({ event, step }) => {
    const { pitchId } = event.data;

    const pitch = await step.run('load-pitch', async () =>
      db.query.pitches.findFirst({ where: eq(pitches.id, pitchId) })
    );
    if (!pitch || pitch.status !== 'queued') {
      return { skipped: 'pitch_not_queued' };
    }

    const client = await step.run('load-client', async () =>
      db.query.clientProfiles.findFirst({
        where: eq(clientProfiles.id, pitch.clientProfileId),
      })
    );
    if (!client?.unipileAccountId) {
      return { skipped: 'no_unipile_account' };
    }

    // Compute next eligible send slot (Tue/Wed/Thu, 9am-2pm)
    const sendAt = computeNextSendSlot(new Date(), {
      warmupMode: !!client.newSendingDomain,
    });

    await step.run('update-scheduled', async () =>
      db.update(pitches)
        .set({ status: 'scheduled', sendScheduledFor: sendAt })
        .where(eq(pitches.id, pitchId))
    );

    await step.run('log-scheduled', async () =>
      db.insert(sendEvents).values({
        pitchId,
        eventType: 'scheduled',
        payload: { sendAt: sendAt.toISOString() },
      })
    );

    // Schedule the actual send
    await step.sendEvent('schedule-the-send', {
      name: 'pitch.scheduled',
      data: { pitchId, sendAt: sendAt.toISOString() },
      ts: sendAt.getTime(),
    });

    return { scheduledFor: sendAt.toISOString() };
  }
);

// ───────────────────────────────────────────────────────────────
// SEND — fires at the scheduled time
// ───────────────────────────────────────────────────────────────

export const sendPitch = inngest.createFunction(
  {
    id: 'send-pitch',
    name: 'Send: fire pitch',
    concurrency: { limit: 5 },  // throttle to 5 simultaneous sends
  },
  { event: 'pitch.scheduled' },
  async ({ event, step }) => {
    const { pitchId } = event.data;

    // Jitter 45-90 seconds to space sends within a batch
    const jitterMs = (45 + Math.random() * 45) * 1000;
    await step.sleep('jitter', `${Math.round(jitterMs)}ms`);

    const pitch = await step.run('load-pitch', async () =>
      db.query.pitches.findFirst({ where: eq(pitches.id, pitchId) })
    );
    if (!pitch || pitch.status !== 'scheduled') {
      return { skipped: 'pitch_not_scheduled' };
    }

    const client = await step.run('load-client', async () =>
      db.query.clientProfiles.findFirst({
        where: eq(clientProfiles.id, pitch.clientProfileId),
      })
    );
    if (!client?.unipileAccountId) {
      await step.run('mark-failed-no-account', async () =>
        db.update(pitches)
          .set({ status: 'failed' })
          .where(eq(pitches.id, pitchId))
      );
      return { failed: 'no_unipile_account' };
    }

    const podcast = await step.run('load-podcast', async () =>
      db.query.podcasts.findFirst({ where: eq(podcasts.id, pitch.podcastId) })
    );
    const hostEmail = podcast?.hostEmails?.[0];
    if (!hostEmail) {
      return { failed: 'no_host_email' };
    }

    // Verify quota one more time before sending (race protection)
    const sub = await step.run('quota-check', async () =>
      db.query.subscriptions.findFirst({
        where: eq(subscriptions.clientProfileId, client.id),
      })
    );
    if (!sub || sub.pitchesUsedThisPeriod >= sub.monthlyPitchQuota) {
      await step.run('mark-failed-quota', async () =>
        db.update(pitches).set({ status: 'failed' }).where(eq(pitches.id, pitchId))
      );
      return { failed: 'quota_exceeded' };
    }

    // Send via Unipile
    const result = await step.run('send-via-unipile', async () =>
      sendViaUnipile({
        accountId: client.unipileAccountId!,
        to: hostEmail,
        subject: pitch.subject!,
        body: pitch.body!,
      })
    );

    if (!result.success) {
      await step.run('mark-failed-send', async () =>
        db.update(pitches).set({ status: 'failed' }).where(eq(pitches.id, pitchId))
      );
      await step.run('log-failure', async () =>
        db.insert(sendEvents).values({
          pitchId,
          eventType: 'failed',
          payload: { error: result.error },
        })
      );
      return { failed: result.error };
    }

    // Update pitch + increment quota usage
    await step.run('mark-sent', async () =>
      db.update(pitches)
        .set({
          status: 'sent',
          sentAt: new Date(),
          messageId: result.messageId,
          threadId: result.threadId,
        })
        .where(eq(pitches.id, pitchId))
    );

    await step.run('increment-quota', async () =>
      db.update(subscriptions)
        .set({ pitchesUsedThisPeriod: sub.pitchesUsedThisPeriod + 1 })
        .where(eq(subscriptions.clientProfileId, client.id))
    );

    await step.run('log-sent', async () =>
      db.insert(sendEvents).values({
        pitchId,
        eventType: 'sent',
        payload: { messageId: result.messageId },
      })
    );

    await step.sendEvent('emit-pitch-sent', {
      name: 'pitch.sent',
      data: { pitchId },
    });

    // If this is the very first pitch ever sent for this client, fire the
    // onboarding "first pitches sent" email. We count AFTER mark-sent, so a
    // count of exactly 1 means the pitch we just sent is the first.
    const sentSoFar = await step.run('count-sent', async () => {
      const [row] = await db
        .select({ value: count() })
        .from(pitches)
        .where(and(eq(pitches.clientProfileId, client.id), eq(pitches.status, 'sent')));
      return row?.value ?? 0;
    });
    if (sentSoFar === 1) {
      await step.sendEvent('emit-first-pitches-sent', {
        name: 'client.first_pitches_sent',
        data: { clientProfileId: client.id, pitchIds: [pitchId] },
      });
    }

    // Schedule the Step 1 follow-up at +4 days (next Tue/Wed/Thu after that)
    if (pitch.step === 'step1') {
      const followupAt = computeFollowupSlot(new Date());
      await step.sendEvent('schedule-followup', {
        name: 'pitch.followup_due',
        data: { pitchId },
        ts: followupAt.getTime(),
      });
    }

    return { success: true, messageId: result.messageId };
  }
);

// ───────────────────────────────────────────────────────────────
// SCHEDULING HELPERS
// ───────────────────────────────────────────────────────────────

/**
 * Find the next Tue/Wed/Thu between 9am-2pm Eastern.
 * In warmup mode, adds an extra day of buffer.
 */
function computeNextSendSlot(
  from: Date,
  opts: { warmupMode?: boolean } = {}
): Date {
  const result = new Date(from);
  result.setUTCHours(14, 0, 0, 0);  // 10am Eastern in UTC (rough)

  // Push forward until we hit Tue/Wed/Thu
  let attempts = 0;
  while (attempts < 10) {
    const day = result.getUTCDay();  // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    const isValidDay = day === 2 || day === 3 || day === 4;
    const isInFuture = result.getTime() > from.getTime() + 60 * 1000;  // 1 min buffer

    if (isValidDay && isInFuture) {
      // In warmup, push one more business day
      if (opts.warmupMode && attempts === 0) {
        result.setUTCDate(result.getUTCDate() + 2);
        continue;
      }
      return result;
    }

    result.setUTCDate(result.getUTCDate() + 1);
    attempts++;
  }

  return result;  // Fallback after 10 days max
}

/**
 * 4-5 days after the original send, on the next Tue/Wed/Thu.
 */
function computeFollowupSlot(originalSend: Date): Date {
  const target = new Date(originalSend);
  target.setUTCDate(target.getUTCDate() + 4);  // baseline 4 days out
  return computeNextSendSlot(target);
}

export const SEND_PIPELINE_FUNCTIONS = [schedulePitchSend, sendPitch];
