import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { responses, pitches, podcasts, clientProfiles, users } from '@/db/schema';
import { sendTransactionalEmail } from '@/lib/resend';
import type { ToolDefinition } from '@/lib/agent/types';

type ForwardInput = { response_id: string; note?: string };

/**
 * Tool 11 — forward_response_to_client
 * For NON-positive replies (soft_no, hard_no, question, auto_reply, other): email
 * the client a heads-up with the host's message quoted, and stamp
 * forwardedToClientAt so it is not forwarded twice. Positive / booking replies use
 * the hot-lead draft workflow instead, so this tool refuses them.
 */
export const forwardResponseToClient: ToolDefinition<ForwardInput> = {
  name: 'forward_response_to_client',
  description:
    "Forward a NON-positive host reply (soft_no, hard_no, question, auto_reply, other) to the client by email, with the host's message quoted and an optional note. Stamps it forwarded so it won't go twice. Positive and booking_inquiry replies are handled by the hot-lead draft flow, not this tool.",
  inputSchema: {
    type: 'object',
    properties: {
      response_id: { type: 'string', description: 'The response_id to forward.' },
      note: { type: 'string', description: 'Optional short note from the VA to the client.' },
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

    if (response.classification === 'positive' || response.classification === 'booking_inquiry') {
      return {
        error:
          'This is a positive/booking reply — use the hot-lead draft workflow (draft_positive_reply) instead of forwarding.',
      };
    }

    if (response.forwardedToClientAt) {
      return { ok: true, already_forwarded: true, forwarded_at: response.forwardedToClientAt.toISOString() };
    }

    const client = await db.query.clientProfiles.findFirst({
      where: eq(clientProfiles.id, pitch.clientProfileId),
    });
    const user = client ? await db.query.users.findFirst({ where: eq(users.id, client.userId) }) : null;
    if (!user?.email) return { error: 'Client has no email on file.' };

    const podcast = await db.query.podcasts.findFirst({ where: eq(podcasts.id, pitch.podcastId) });
    const firstName = (user.fullName ?? '').split(' ')[0] || 'there';

    const emailBody = `Hi ${firstName},

A host replied to one of your pitches. Here is what came back so nothing slips through.

Podcast: ${podcast?.title ?? 'the show'}${podcast?.hostName ? ` (host: ${podcast.hostName})` : ''}
From: ${response.fromEmail}
${response.subject ? `Subject: ${response.subject}\n` : ''}
${(response.body ?? '').slice(0, 1500)}
${input.note ? `\nNote from your team: ${input.note}\n` : ''}
You can reply directly from your own inbox if you'd like to respond.

— PodEngine`;

    const sent = await sendTransactionalEmail({
      to: user.email,
      subject: `A host replied: ${podcast?.title ?? 'your pitch'}`,
      body: emailBody,
    });
    if (!sent.sent) return { error: `Failed to send notification: ${sent.error}` };

    await db
      .update(responses)
      .set({ forwardedToClientAt: new Date() })
      .where(eq(responses.id, response.id));

    return {
      ok: true,
      forwarded_to: user.email,
      classification: response.classification ?? 'pending',
    };
  },
};
