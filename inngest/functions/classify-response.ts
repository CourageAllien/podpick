/**
 * PodPick — Response classification + hot-lead creation
 *
 * Trigger flow:
 *   Unipile inbound webhook stores a `responses` row and emits response.received →
 *   classifyResponse runs → Claude classifies → responses.classification set →
 *   if positive or booking_inquiry, a positive_reply_lifecycle row opens at stage
 *   'new' so the VA picks it up in the Hot Leads dashboard.
 *
 * Only positive / booking_inquiry open a lifecycle. Everything else is recorded
 * and left for the agent's forward_response_to_client flow. We never auto-respond.
 */

import { inngest } from '../client';
import { db } from '@/db';
import { responses, pitches, positiveReplyLifecycle } from '@/db/schema';
import { classifyReply } from '@/lib/classify-reply';
import { eq } from 'drizzle-orm';

const HOT_LEAD_CLASSES = ['positive', 'booking_inquiry'];

export const classifyResponse = inngest.createFunction(
  { id: 'classify-response', name: 'Responses: classify reply' },
  { event: 'response.received' },
  async ({ event, step }) => {
    const { responseId } = event.data;

    const response = await step.run('load-response', async () =>
      db.query.responses.findFirst({ where: eq(responses.id, responseId) })
    );
    if (!response) return { skipped: 'response_not_found' };
    if (response.classification) return { skipped: 'already_classified' };

    const result = await step.run('classify', async () =>
      classifyReply({
        subject: response.subject,
        body: response.body,
        fromEmail: response.fromEmail,
      })
    );

    await step.run('save-classification', async () =>
      db
        .update(responses)
        .set({ classification: result.classification })
        .where(eq(responses.id, responseId))
    );

    if (!HOT_LEAD_CLASSES.includes(result.classification)) {
      return { classification: result.classification, hotLead: false };
    }

    // Open the hot-lead lifecycle (idempotent on responseId via unique constraint).
    const pitch = await step.run('load-pitch', async () =>
      db.query.pitches.findFirst({ where: eq(pitches.id, response.pitchId) })
    );
    if (!pitch) return { classification: result.classification, skipped: 'pitch_not_found' };

    const existing = await step.run('check-existing-lifecycle', async () =>
      db.query.positiveReplyLifecycle.findFirst({
        where: eq(positiveReplyLifecycle.responseId, responseId),
      })
    );
    if (existing) {
      return { classification: result.classification, hotLead: true, lifecycleId: existing.id };
    }

    const [lifecycle] = await step.run('create-lifecycle', async () =>
      db
        .insert(positiveReplyLifecycle)
        .values({
          responseId,
          pitchId: pitch.id,
          clientProfileId: pitch.clientProfileId,
          stage: 'new',
          lastActivityAt: new Date(),
        })
        .returning({ id: positiveReplyLifecycle.id })
    );

    return { classification: result.classification, hotLead: true, lifecycleId: lifecycle.id };
  }
);

export const RESPONSE_FUNCTIONS = [classifyResponse];
