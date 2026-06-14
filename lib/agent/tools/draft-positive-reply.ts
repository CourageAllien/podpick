import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { responses, pitches, positiveReplyLifecycle } from '@/db/schema';
import { buildPositiveReplyDraft, type ReplyIntent } from '@/lib/draft-positive-reply';
import type { ToolDefinition } from '@/lib/agent/types';

type DraftInput = { response_id: string; reply_intent?: ReplyIntent };

/**
 * Tool 16 — draft_positive_reply
 * For a positive/booking reply, drafts the response the CLIENT will send back to
 * the host (first-person, points to media page + calendar). Stores it on the
 * hot-lead lifecycle and moves the stage to 'va_drafted'. This is the most
 * consequential drafting step in the system: it does NOT send. The client reviews,
 * edits, and sends from their own inbox.
 */
export const draftPositiveReply: ToolDefinition<DraftInput> = {
  name: 'draft_positive_reply',
  description:
    "For a positive or booking_inquiry reply, draft the response the CLIENT will send back to the host (first-person, warm, points to their media page and calendar). Stores the draft on the hot-lead lifecycle and sets stage to 'va_drafted'. Never sends — the client reviews and sends it themselves. Use reply_intent to shape it: send_one_pager (default), address_question, or redirect_topic.",
  inputSchema: {
    type: 'object',
    properties: {
      response_id: { type: 'string', description: 'The positive/booking response to answer.' },
      reply_intent: {
        type: 'string',
        enum: ['send_one_pager', 'address_question', 'redirect_topic'],
        description: 'How to shape the draft. Default send_one_pager.',
      },
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

    const lifecycle = await db.query.positiveReplyLifecycle.findFirst({
      where: eq(positiveReplyLifecycle.responseId, response.id),
    });
    if (!lifecycle) {
      return {
        error:
          'No hot-lead lifecycle for this response. Only positive/booking replies open one; check the classification.',
      };
    }

    const draft = await buildPositiveReplyDraft({
      responseId: response.id,
      intent: input.reply_intent,
    });
    if ('error' in draft) return { error: draft.error };

    await db
      .update(positiveReplyLifecycle)
      .set({
        vaDraftResponse: draft.draftBody,
        vaDraftedAt: new Date(),
        vaDraftedBy: ctx.userId,
        stage: 'va_drafted',
        lastActivityAt: new Date(),
        daysSinceLastActivity: 0,
        updatedAt: new Date(),
      })
      .where(eq(positiveReplyLifecycle.id, lifecycle.id));

    return {
      lifecycle_id: lifecycle.id,
      draft_subject: draft.draftSubject,
      draft_body: draft.draftBody,
      media_page_url: draft.mediaPageUrl,
      calendar_link: draft.calendarLink,
      stage: 'va_drafted',
      client_action_required: draft.clientActionRequired,
    };
  },
};
