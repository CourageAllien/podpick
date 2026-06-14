/**
 * PodPick — Monthly recap generator
 *
 * Fires on each client's subscription period rollover. Aggregates the period's
 * activity, writes a monthly_recaps row, and notifies the VA to add their
 * qualitative observation before the message goes to the client.
 *
 * The VA-added observation is what makes the recap feel managed (not robotic).
 * Without it, the recap is just numbers.
 */

import { inngest } from '../client';
import { db } from '@/db';
import {
  monthlyRecaps,
  pitches,
  responses,
  positiveReplyLifecycle,
  clientProfiles,
  conversations,
  messages,
} from '@/db/schema';
import { eq, and, gte, lte, count } from 'drizzle-orm';

export const onPeriodRollover = inngest.createFunction(
  { id: 'monthly-recap-on-rollover', name: 'Monthly: recap on period rollover' },
  { event: 'client.period_rollover' },
  async ({ event, step }) => {
    const { clientProfileId, periodEnd } = event.data;
    const periodEndDate = new Date(periodEnd);
    const periodStartDate = new Date(
      periodEndDate.getTime() - 30 * 24 * 60 * 60 * 1000
    );

    // Aggregate numbers for the period
    const stats = await step.run('aggregate-stats', async () => {
      const sentPitches = await db.query.pitches.findMany({
        where: and(
          eq(pitches.clientProfileId, clientProfileId),
          eq(pitches.status, 'sent'),
          gte(pitches.sentAt!, periodStartDate),
          lte(pitches.sentAt!, periodEndDate)
        ),
      });

      const step1Count = sentPitches.filter((p) => p.step === 'step1').length;
      const step2Count = sentPitches.filter((p) => p.step === 'step2').length;

      const pitchIds = sentPitches.map((p) => p.id);

      const allReplies = pitchIds.length === 0 ? [] :
        await db.query.responses.findMany({
          where: gte(responses.receivedAt, periodStartDate),
        });

      const repliesForOurPitches = allReplies.filter((r) => pitchIds.includes(r.pitchId));
      const positives = repliesForOurPitches.filter((r) => r.classification === 'positive');

      const bookings = await db.query.positiveReplyLifecycle.findMany({
        where: and(
          eq(positiveReplyLifecycle.clientProfileId, clientProfileId),
          gte(positiveReplyLifecycle.lastActivityAt, periodStartDate)
        ),
      });

      const bookedCount = bookings.filter(
        (b) => b.stage === 'booked' || b.stage === 'recorded' || b.stage === 'live'
      ).length;

      return {
        pitchesSent: sentPitches.length,
        pitchesStep1: step1Count,
        pitchesStep2: step2Count,
        repliesReceived: repliesForOurPitches.length,
        positiveReplies: positives.length,
        bookings: bookedCount,
      };
    });

    // Insert recap row in 'draft' state (no sentAt set yet)
    const recapId = await step.run('insert-recap', async () => {
      const [recap] = await db.insert(monthlyRecaps).values({
        clientProfileId,
        periodStart: periodStartDate,
        periodEnd: periodEndDate,
        pitchesSent: stats.pitchesSent,
        pitchesStep1: stats.pitchesStep1,
        pitchesStep2: stats.pitchesStep2,
        repliesReceived: stats.repliesReceived,
        positiveReplies: stats.positiveReplies,
        bookings: stats.bookings,
        observations: null,  // VA fills this in
      }).returning();
      return recap.id;
    });

    // Notify the assigned VA in their dashboard
    const client = await step.run('load-client', async () =>
      db.query.clientProfiles.findFirst({
        where: eq(clientProfiles.id, clientProfileId),
      })
    );

    if (!client?.assignedVaId) {
      return { recapId, vaNotified: false, reason: 'no_va_assigned' };
    }

    // Drop a system message into the VA's conversation thread
    // The VA edits and sends the recap from there
    const conversation = await step.run('find-or-create-conversation', async () => {
      const existing = await db.query.conversations.findFirst({
        where: and(
          eq(conversations.clientProfileId, clientProfileId),
          eq(conversations.vaId, client.assignedVaId!)
        ),
      });
      if (existing) return existing;

      const [created] = await db.insert(conversations).values({
        clientProfileId,
        vaId: client.assignedVaId,
      }).returning();
      return created;
    });

    await step.run('insert-system-prompt', async () =>
      db.insert(messages).values({
        conversationId: conversation.id,
        senderId: client.assignedVaId!,  // attributed to VA, system-generated
        senderRole: 'va',
        body: `📊 Monthly recap ready to send. Period: ${periodStartDate.toLocaleDateString()} → ${periodEndDate.toLocaleDateString()}.\n\nNumbers:\n- Pitches sent: ${stats.pitchesSent} (Step 1: ${stats.pitchesStep1}, Step 2: ${stats.pitchesStep2})\n- Replies: ${stats.repliesReceived} (positive: ${stats.positiveReplies})\n- Bookings: ${stats.bookings}\n\nAdd your observation about what's working/not working before sending. Open the recap editor in your dashboard to finalize.`,
      })
    );

    return { recapId, vaNotified: true, stats };
  }
);

export const MONTHLY_RECAP_FUNCTIONS = [onPeriodRollover];
