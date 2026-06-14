'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/db';
import {
  positiveReplyLifecycle,
  pitches as pitchesTable,
  responses as responsesTable,
} from '@/db/schema';
import { getCurrentClientProfile } from '@/lib/auth';
import { sendEmail } from '@/lib/unipile';

/**
 * Client sends the VA-drafted response from their own connected inbox.
 * Advances the lifecycle stage new/va_drafted/client_notified → response_sent.
 */
export async function sendLeadResponse(
  lifecycleId: string,
  editedBody: string
): Promise<{ ok: true } | { error: string }> {
  const profile = await getCurrentClientProfile();
  if (!profile) return { error: 'Not authenticated' };
  if (!profile.unipileAccountId) {
    return { error: 'Connect your sending inbox in Settings before sending.' };
  }

  const lead = await db.query.positiveReplyLifecycle.findFirst({
    where: eq(positiveReplyLifecycle.id, lifecycleId),
  });
  if (!lead || lead.clientProfileId !== profile.id) {
    return { error: 'Lead not found' };
  }

  const [pitch, response] = await Promise.all([
    db.query.pitches.findFirst({ where: eq(pitchesTable.id, lead.pitchId) }),
    db.query.responses.findFirst({ where: eq(responsesTable.id, lead.responseId) }),
  ]);
  if (!response) return { error: 'Original response not found' };

  const result = await sendEmail({
    accountId: profile.unipileAccountId,
    to: response.fromEmail,
    subject: response.subject ? `Re: ${response.subject}` : 'Re: your reply',
    body: editedBody,
    threadId: pitch?.threadId ?? undefined,
  });

  if (!result.success) {
    return { error: result.error || 'Send failed' };
  }

  await db
    .update(positiveReplyLifecycle)
    .set({
      stage: 'response_sent',
      vaDraftResponse: editedBody,
      clientSentAt: new Date(),
      lastActivityAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(positiveReplyLifecycle.id, lifecycleId));

  return { ok: true };
}
