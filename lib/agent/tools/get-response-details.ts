import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { responses, pitches, podcasts, positiveReplyLifecycle } from '@/db/schema';
import type { ToolDefinition } from '@/lib/agent/types';

type DetailsInput = { response_id: string };

/**
 * Tool 10 — get_response_details
 * Full detail for one reply: the host's message body, the pitch it answers, the
 * podcast, and any open hot-lead lifecycle (stage + whether a draft exists). Used
 * before drafting or forwarding. Re-checks the reply belongs to the active client.
 */
export const getResponseDetails: ToolDefinition<DetailsInput> = {
  name: 'get_response_details',
  description:
    "Get the full detail of one host reply by response_id: the message body and subject, the pitch it answers, the podcast/host, its classification, and any open hot-lead lifecycle (stage and whether a draft response exists). Call before drafting or forwarding.",
  inputSchema: {
    type: 'object',
    properties: {
      response_id: { type: 'string', description: 'The response_id from list_responses.' },
    },
    required: ['response_id'],
  },
  async execute(input, ctx) {
    const response = await db.query.responses.findFirst({
      where: eq(responses.id, input.response_id),
    });
    if (!response) return { error: 'Response not found.' };

    const pitch = await db.query.pitches.findFirst({ where: eq(pitches.id, response.pitchId) });
    if (!pitch || pitch.clientProfileId !== ctx.clientProfileId) {
      return { error: 'Response does not belong to the active client.' };
    }

    const podcast = await db.query.podcasts.findFirst({ where: eq(podcasts.id, pitch.podcastId) });
    const lifecycle = await db.query.positiveReplyLifecycle.findFirst({
      where: eq(positiveReplyLifecycle.responseId, response.id),
    });

    return {
      response_id: response.id,
      from_email: response.fromEmail,
      subject: response.subject,
      body: response.body,
      classification: response.classification ?? 'pending',
      forwarded_to_client: Boolean(response.forwardedToClientAt),
      received_at: response.receivedAt?.toISOString() ?? null,
      pitch: {
        pitch_id: pitch.id,
        step: pitch.step,
        subject: pitch.subject,
        body: pitch.body,
        sent_at: pitch.sentAt?.toISOString() ?? null,
      },
      podcast: {
        podcast_id: podcast?.id ?? pitch.podcastId,
        title: podcast?.title ?? null,
        host_name: podcast?.hostName ?? null,
      },
      hot_lead: lifecycle
        ? {
            lifecycle_id: lifecycle.id,
            stage: lifecycle.stage,
            has_draft: Boolean(lifecycle.vaDraftResponse),
            booked_for: lifecycle.bookedFor?.toISOString() ?? null,
          }
        : null,
    };
  },
};
