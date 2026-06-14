import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { responses, pitches, podcasts, positiveReplyLifecycle } from '@/db/schema';
import type { ToolDefinition } from '@/lib/agent/types';

type ListInput = { classification?: string; only_unforwarded?: boolean };

const VALID_CLASSES = [
  'positive',
  'soft_no',
  'hard_no',
  'auto_reply',
  'question',
  'booking_inquiry',
  'other',
];

/**
 * Tool 9 — list_responses
 * Lists replies hosts sent to this client's pitches, newest first, with their
 * classification and whether a hot-lead lifecycle is open. Scoped to the active
 * client via the pitch join so the agent can never read another client's inbox.
 */
export const listResponses: ToolDefinition<ListInput> = {
  name: 'list_responses',
  description:
    "List replies hosts have sent to the active client's pitches, newest first, each with its classification (positive, soft_no, hard_no, auto_reply, question, booking_inquiry, other) and whether a hot-lead lifecycle is open. Optionally filter by classification or to only those not yet forwarded to the client.",
  inputSchema: {
    type: 'object',
    properties: {
      classification: {
        type: 'string',
        enum: VALID_CLASSES,
        description: 'Optional: only responses with this classification.',
      },
      only_unforwarded: {
        type: 'boolean',
        description: 'Optional: only responses not yet forwarded to the client.',
      },
    },
  },
  async execute(input, ctx) {
    const rows = await db
      .select({
        id: responses.id,
        pitchId: responses.pitchId,
        fromEmail: responses.fromEmail,
        subject: responses.subject,
        classification: responses.classification,
        forwardedToClientAt: responses.forwardedToClientAt,
        receivedAt: responses.receivedAt,
        podcastTitle: podcasts.title,
        hostName: podcasts.hostName,
      })
      .from(responses)
      .innerJoin(pitches, eq(responses.pitchId, pitches.id))
      .innerJoin(podcasts, eq(pitches.podcastId, podcasts.id))
      .where(eq(pitches.clientProfileId, ctx.clientProfileId))
      .orderBy(desc(responses.receivedAt));

    const lifecycleRows = await db
      .select({ responseId: positiveReplyLifecycle.responseId, stage: positiveReplyLifecycle.stage })
      .from(positiveReplyLifecycle)
      .where(eq(positiveReplyLifecycle.clientProfileId, ctx.clientProfileId));
    const lifecycleByResponse = new Map(lifecycleRows.map((l) => [l.responseId, l.stage]));

    let filtered = rows;
    if (input.classification) {
      filtered = filtered.filter((r) => r.classification === input.classification);
    }
    if (input.only_unforwarded) {
      filtered = filtered.filter((r) => !r.forwardedToClientAt);
    }

    return {
      count: filtered.length,
      responses: filtered.map((r) => ({
        response_id: r.id,
        pitch_id: r.pitchId,
        podcast_title: r.podcastTitle,
        host_name: r.hostName,
        from_email: r.fromEmail,
        subject: r.subject,
        classification: r.classification ?? 'pending',
        forwarded_to_client: Boolean(r.forwardedToClientAt),
        hot_lead_stage: lifecycleByResponse.get(r.id) ?? null,
        received_at: r.receivedAt?.toISOString() ?? null,
      })),
    };
  },
};
