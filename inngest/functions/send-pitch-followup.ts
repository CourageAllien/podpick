/**
 * PodPick — Step 1 follow-up firing
 *
 * Triggered 4-5 days after a Step 1 pitch send. Checks for replies, and if
 * the host is still silent, generates + sends a brief in-thread follow-up.
 *
 * Step 2 follow-ups follow the same pattern but use a different message body.
 */

import { inngest } from '../client';
import { generatePitch } from '@/lib/anthropic';
import { sendEmail as sendViaUnipile } from '@/lib/unipile';
import { db } from '@/db';
import { pitches, responses, podcasts, clientProfiles, sendEvents } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const sendPitchFollowup = inngest.createFunction(
  { id: 'send-pitch-followup', name: 'Send: pitch follow-up' },
  { event: 'pitch.followup_due' },
  async ({ event, step }) => {
    const { pitchId } = event.data;

    // 1. Load original pitch
    const original = await step.run('load-original', async () =>
      db.query.pitches.findFirst({ where: eq(pitches.id, pitchId) })
    );
    if (!original || original.status !== 'sent') {
      return { skipped: 'original_not_sent' };
    }

    // 2. Check if a reply was received already
    const reply = await step.run('check-reply', async () =>
      db.query.responses.findFirst({ where: eq(responses.pitchId, pitchId) })
    );
    if (reply) {
      return { skipped: 'reply_already_received' };
    }

    // 3. Load context
    const client = await step.run('load-client', async () =>
      db.query.clientProfiles.findFirst({
        where: eq(clientProfiles.id, original.clientProfileId),
      })
    );
    const podcast = await step.run('load-podcast', async () =>
      db.query.podcasts.findFirst({ where: eq(podcasts.id, original.podcastId) })
    );

    if (!client?.unipileAccountId || !podcast?.hostEmails?.[0]) {
      return { skipped: 'missing_send_context' };
    }

    // 4. Compose a brief in-thread follow-up
    const hostFirstName = (podcast.hostName || '').split(' ')[0] || 'there';
    const clientFirstName = (client.oneLineBio?.split(',')[0] ||
      client.company ||
      'me').split(' ')[0];

    const followupBody =
      original.step === 'step1'
        ? buildStep1FollowupBody(hostFirstName, clientFirstName, original.body || '')
        : buildStep2FollowupBody(hostFirstName, clientFirstName, original.body || '');

    // 5. Send in-thread
    const result = await step.run('send-followup', async () =>
      sendViaUnipile({
        accountId: client.unipileAccountId!,
        to: podcast.hostEmails![0],
        subject: original.subject!,  // reply in-thread, same subject (Re: prefix added by email client)
        body: followupBody,
        threadId: original.threadId || undefined,
      })
    );

    if (!result.success) {
      await step.run('log-failure', async () =>
        db.insert(sendEvents).values({
          pitchId,
          eventType: 'failed',
          payload: { error: result.error, type: 'followup' },
        })
      );
      return { failed: result.error };
    }

    await step.run('log-followup-sent', async () =>
      db.insert(sendEvents).values({
        pitchId,
        eventType: 'sent',
        payload: { type: 'followup', messageId: result.messageId },
      })
    );

    return { success: true, messageId: result.messageId };
  }
);

// ───────────────────────────────────────────────────────────────
// FOLLOW-UP BODY BUILDERS
// ───────────────────────────────────────────────────────────────

/**
 * Step 1 follow-up: short bump referencing the original angle.
 * Template-based (not AI-generated) — these are intentionally short and uniform.
 */
function buildStep1FollowupBody(
  hostFirstName: string,
  clientFirstName: string,
  originalBody: string
): string {
  // Extract the angle hint from the first line of original body
  const angleHint = extractAngleHint(originalBody);

  return `${hostFirstName} — knowing your inbox is buried. Quick bump in case mine got lost.

Original ask was about ${angleHint}. If it's not a fit, no worries — totally happy to leave you be.

— ${clientFirstName}`;
}

function buildStep2FollowupBody(
  hostFirstName: string,
  clientFirstName: string,
  originalBody: string
): string {
  const angleHint = extractAngleHint(originalBody);

  return `${hostFirstName} — circling back once. If the angle on ${angleHint} doesn't fit the show, totally fine to ignore. Just figured I'd ask once more.

— ${clientFirstName}`;
}

function extractAngleHint(originalBody: string): string {
  // Very simple heuristic — pull a meaningful chunk from the second paragraph.
  // In production, store the angle explicitly when generating the original pitch.
  const paragraphs = originalBody.split('\n\n').filter((p) => p.trim());
  if (paragraphs.length >= 2) {
    const second = paragraphs[1].trim();
    const firstSentence = second.split(/[.!?]/)[0].trim();
    if (firstSentence.length > 80) {
      return firstSentence.slice(0, 80) + '...';
    }
    return firstSentence || 'the angle we discussed';
  }
  return 'the angle we discussed';
}

export const FOLLOWUP_FUNCTIONS = [sendPitchFollowup];
