'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import {
  positiveReplyLifecycle,
  responses,
  pitches,
  podcasts,
  clientProfiles,
  users,
} from '@/db/schema';
import { getCurrentUser, getCurrentClientProfile } from '@/lib/auth';
import { buildPositiveReplyDraft, type ReplyIntent } from '@/lib/draft-positive-reply';
import { sendTransactionalEmail } from '@/lib/resend';

/**
 * Server actions for the positive-reply (Hot Leads) lifecycle.
 *
 * Two sides, two authorization rules:
 *  - VA/admin actions: draft, edit, forward-to-client, stage/booking updates. The
 *    VA must be assigned to the lead's client (admins bypass).
 *  - Client actions: edit their own draft and mark it sent. The client must own
 *    the lead's profile. The product NEVER sends a positive reply on the client's
 *    behalf — the client sends it from their own inbox; we only record that.
 */

type ActionResult = { ok: true } | { error: string };

type Lifecycle = typeof positiveReplyLifecycle.$inferSelect;

async function authorizeVaForLifecycle(
  lifecycleId: string
): Promise<{ ok: false; error: string } | { ok: true; lifecycle: Lifecycle; userId: string }> {
  const me = await getCurrentUser();
  if (!me || (me.role !== 'va' && me.role !== 'admin')) {
    return { ok: false, error: 'Not authorized' };
  }
  const lifecycle = await db.query.positiveReplyLifecycle.findFirst({
    where: eq(positiveReplyLifecycle.id, lifecycleId),
  });
  if (!lifecycle) return { ok: false, error: 'Lead not found' };

  if (me.role === 'va') {
    const client = await db.query.clientProfiles.findFirst({
      where: eq(clientProfiles.id, lifecycle.clientProfileId),
    });
    if (!client || client.assignedVaId !== me.id) {
      return { ok: false, error: 'Not assigned to this client' };
    }
  }
  return { ok: true, lifecycle, userId: me.id };
}

async function authorizeClientForLifecycle(
  lifecycleId: string
): Promise<{ ok: false; error: string } | { ok: true; lifecycle: Lifecycle }> {
  const profile = await getCurrentClientProfile();
  if (!profile) return { ok: false, error: 'Not authorized' };
  const lifecycle = await db.query.positiveReplyLifecycle.findFirst({
    where: eq(positiveReplyLifecycle.id, lifecycleId),
  });
  if (!lifecycle) return { ok: false, error: 'Lead not found' };
  if (lifecycle.clientProfileId !== profile.id) return { ok: false, error: 'Not your lead' };
  return { ok: true, lifecycle };
}

function vaPath(clientProfileId: string) {
  return `/va/clients/${clientProfileId}/leads`;
}

/** VA: generate (or regenerate) the suggested client response and store it. */
export async function generateVaDraftResponse(
  lifecycleId: string,
  intent?: ReplyIntent
): Promise<ActionResult> {
  const auth = await authorizeVaForLifecycle(lifecycleId);
  if (!auth.ok) return { error: auth.error };
  const { lifecycle, userId } = auth;

  const draft = await buildPositiveReplyDraft({ responseId: lifecycle.responseId, intent });
  if ('error' in draft) return { error: draft.error };

  await db
    .update(positiveReplyLifecycle)
    .set({
      vaDraftResponse: draft.draftBody,
      vaDraftedAt: new Date(),
      vaDraftedBy: userId,
      stage: lifecycle.stage === 'new' ? 'va_drafted' : lifecycle.stage,
      lastActivityAt: new Date(),
      daysSinceLastActivity: 0,
      updatedAt: new Date(),
    })
    .where(eq(positiveReplyLifecycle.id, lifecycleId));

  revalidatePath(vaPath(lifecycle.clientProfileId));
  return { ok: true };
}

/** VA: hand-edit the stored draft. */
export async function saveVaDraftResponse(
  lifecycleId: string,
  draftText: string
): Promise<ActionResult> {
  const auth = await authorizeVaForLifecycle(lifecycleId);
  if (!auth.ok) return { error: auth.error };
  const { lifecycle, userId } = auth;

  if (draftText.includes('—')) return { error: 'Remove em dashes before saving (house style).' };

  await db
    .update(positiveReplyLifecycle)
    .set({
      vaDraftResponse: draftText,
      vaDraftedAt: new Date(),
      vaDraftedBy: userId,
      stage: lifecycle.stage === 'new' ? 'va_drafted' : lifecycle.stage,
      lastActivityAt: new Date(),
      daysSinceLastActivity: 0,
      updatedAt: new Date(),
    })
    .where(eq(positiveReplyLifecycle.id, lifecycleId));

  revalidatePath(vaPath(lifecycle.clientProfileId));
  return { ok: true };
}

/**
 * VA (Tool 17 equivalent): notify the client. Emails them the host's reply plus
 * the drafted response, and moves the lead to 'client_notified'. After this, the
 * client takes over in their own dashboard.
 */
export async function forwardPositiveReplyToClient(
  lifecycleId: string,
  vaNote?: string
): Promise<ActionResult> {
  const auth = await authorizeVaForLifecycle(lifecycleId);
  if (!auth.ok) return { error: auth.error };
  const { lifecycle } = auth;

  if (!lifecycle.vaDraftResponse) {
    return { error: 'Draft a response before notifying the client.' };
  }

  const response = await db.query.responses.findFirst({
    where: eq(responses.id, lifecycle.responseId),
  });
  const pitch = await db.query.pitches.findFirst({ where: eq(pitches.id, lifecycle.pitchId) });
  const podcast = pitch
    ? await db.query.podcasts.findFirst({ where: eq(podcasts.id, pitch.podcastId) })
    : null;
  const client = await db.query.clientProfiles.findFirst({
    where: eq(clientProfiles.id, lifecycle.clientProfileId),
  });
  const user = client ? await db.query.users.findFirst({ where: eq(users.id, client.userId) }) : null;
  if (!user?.email) return { error: 'Client has no email on file.' };

  const firstName = (user.fullName ?? '').split(' ')[0] || 'there';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://podengine.com';

  const emailBody = `Hi ${firstName},

Good news. A host wants to have you on their show.

Podcast: ${podcast?.title ?? 'the show'}${podcast?.hostName ? ` (host: ${podcast.hostName})` : ''}

What they said:
${(response?.body ?? '').slice(0, 1200)}

We drafted a reply for you to review and send from your own inbox:
---
${lifecycle.vaDraftResponse}
---
${vaNote ? `\nNote from your team: ${vaNote}\n` : ''}
Review, edit, and send it here:
${appUrl}/app/leads/${lifecycle.id}

Thanks,
The PodEngine team`;

  const sent = await sendTransactionalEmail({
    to: user.email,
    subject: `A host said yes: ${podcast?.title ?? 'your pitch'}`,
    body: emailBody,
  });
  if (!sent.sent) return { error: `Failed to send notification: ${sent.error}` };

  await db
    .update(positiveReplyLifecycle)
    .set({
      stage: 'client_notified',
      clientNotifiedAt: new Date(),
      lastActivityAt: new Date(),
      daysSinceLastActivity: 0,
      updatedAt: new Date(),
    })
    .where(eq(positiveReplyLifecycle.id, lifecycleId));

  revalidatePath(vaPath(lifecycle.clientProfileId));
  return { ok: true };
}

const ALLOWED_STAGES = [
  'new',
  'va_drafted',
  'client_notified',
  'response_sent',
  'in_conversation',
  'booked',
  'recorded',
  'live',
  'dropped',
] as const;
type Stage = (typeof ALLOWED_STAGES)[number];

/** VA: move a lead along the pipeline (e.g. in_conversation, dropped). */
export async function updateLifecycleStage(
  lifecycleId: string,
  stage: Stage
): Promise<ActionResult> {
  const auth = await authorizeVaForLifecycle(lifecycleId);
  if (!auth.ok) return { error: auth.error };
  if (!ALLOWED_STAGES.includes(stage)) return { error: 'Invalid stage.' };

  await db
    .update(positiveReplyLifecycle)
    .set({ stage, lastActivityAt: new Date(), daysSinceLastActivity: 0, updatedAt: new Date() })
    .where(eq(positiveReplyLifecycle.id, lifecycleId));

  revalidatePath(vaPath(auth.lifecycle.clientProfileId));
  return { ok: true };
}

/** VA: record a confirmed booking. */
export async function recordBooking(
  lifecycleId: string,
  bookedForISO: string,
  episodeUrl?: string
): Promise<ActionResult> {
  const auth = await authorizeVaForLifecycle(lifecycleId);
  if (!auth.ok) return { error: auth.error };

  const bookedFor = new Date(bookedForISO);
  if (Number.isNaN(bookedFor.getTime())) return { error: 'Invalid booking date.' };

  await db
    .update(positiveReplyLifecycle)
    .set({
      stage: 'booked',
      bookedFor,
      episodeUrl: episodeUrl || null,
      lastActivityAt: new Date(),
      daysSinceLastActivity: 0,
      updatedAt: new Date(),
    })
    .where(eq(positiveReplyLifecycle.id, lifecycleId));

  revalidatePath(vaPath(auth.lifecycle.clientProfileId));
  return { ok: true };
}

/** Client: edit their own draft before sending. */
export async function clientUpdateDraft(
  lifecycleId: string,
  draftText: string
): Promise<ActionResult> {
  const auth = await authorizeClientForLifecycle(lifecycleId);
  if (!auth.ok) return { error: auth.error };

  await db
    .update(positiveReplyLifecycle)
    .set({ vaDraftResponse: draftText, lastActivityAt: new Date(), updatedAt: new Date() })
    .where(eq(positiveReplyLifecycle.id, lifecycleId));

  revalidatePath(`/app/leads/${lifecycleId}`);
  revalidatePath('/app');
  return { ok: true };
}

/**
 * Client: confirm they sent the reply from their own inbox. We only RECORD this —
 * the product never sends a positive reply on the client's behalf.
 */
export async function clientMarkResponseSent(lifecycleId: string): Promise<ActionResult> {
  const auth = await authorizeClientForLifecycle(lifecycleId);
  if (!auth.ok) return { error: auth.error };

  await db
    .update(positiveReplyLifecycle)
    .set({
      stage: 'response_sent',
      clientSentAt: new Date(),
      lastActivityAt: new Date(),
      daysSinceLastActivity: 0,
      updatedAt: new Date(),
    })
    .where(eq(positiveReplyLifecycle.id, lifecycleId));

  revalidatePath(`/app/leads/${lifecycleId}`);
  revalidatePath('/app');
  return { ok: true };
}
