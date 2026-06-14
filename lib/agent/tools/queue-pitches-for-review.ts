import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { pitches, podcasts, subscriptions, podcastSuggestions } from '@/db/schema';
import type { ToolDefinition } from '@/lib/agent/types';

type QueueInput = { pitch_ids?: string[] };

/**
 * Tool 8 — queue_pitches_for_review
 * Submits a batch of generated drafts to the VA's bulk-review screen. Validates
 * the drafts belong to the active client, marks their suggested podcasts as
 * `queued`, and returns a quota-aware summary plus the review link. Does NOT send
 * or approve anything — a human approves each pitch in the review screen.
 */
export const queuePitchesForReview: ToolDefinition<QueueInput> = {
  name: 'queue_pitches_for_review',
  description:
    'Submit generated draft pitches to the VA review queue. Pass pitch_ids (or omit to submit all of this client’s current drafts). Returns how many are awaiting review, remaining quota, and the review screen URL. This never sends pitches; a human approves them.',
  inputSchema: {
    type: 'object',
    properties: {
      pitch_ids: {
        type: 'array',
        items: { type: 'string' },
        description: "Specific draft pitch IDs to queue. Omit to queue all of the client's drafts.",
      },
    },
  },
  async execute(input, ctx) {
    const where = input.pitch_ids?.length
      ? and(
          eq(pitches.clientProfileId, ctx.clientProfileId),
          eq(pitches.status, 'draft'),
          inArray(pitches.id, input.pitch_ids)
        )
      : and(eq(pitches.clientProfileId, ctx.clientProfileId), eq(pitches.status, 'draft'));

    const drafts = await db
      .select({
        id: pitches.id,
        podcastId: pitches.podcastId,
        step: pitches.step,
        subject: pitches.subject,
        title: podcasts.title,
      })
      .from(pitches)
      .innerJoin(podcasts, eq(pitches.podcastId, podcasts.id))
      .where(where);

    if (drafts.length === 0) {
      return { queued: 0, message: 'No matching drafts to queue for review.' };
    }

    // Mark the underlying suggestions as queued so they drop off the candidate list.
    const podcastIds = [...new Set(drafts.map((d) => d.podcastId))];
    await db
      .update(podcastSuggestions)
      .set({ status: 'queued', updatedAt: new Date() })
      .where(
        and(
          eq(podcastSuggestions.clientProfileId, ctx.clientProfileId),
          inArray(podcastSuggestions.podcastId, podcastIds)
        )
      );

    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.clientProfileId, ctx.clientProfileId),
      orderBy: [desc(subscriptions.createdAt)],
    });
    const remaining = sub
      ? Math.max(0, sub.monthlyPitchQuota - sub.pitchesUsedThisPeriod)
      : null;

    return {
      queued: drafts.length,
      awaiting_review: drafts.map((d) => ({
        pitch_id: d.id,
        podcast: d.title,
        step: d.step,
        subject: d.subject,
      })),
      quota_remaining: remaining,
      review_url: `/va/clients/${ctx.clientProfileId}/review`,
      note: 'A VA must approve each pitch in the review screen before anything sends.',
    };
  },
};
