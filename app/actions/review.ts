'use server';

import { revalidatePath } from 'next/cache';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { pitches, clientProfiles } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { inngest } from '@/inngest/client';

/**
 * Bulk-review actions for VA-facing pitch approval. Every action re-checks that
 * the caller is the assigned VA (or an admin) for the pitch's client. Approval is
 * the single point where a draft enters the automated send pipeline.
 */

type ActionResult = { ok: true } | { error: string };

type AuthedPitch = {
  id: string;
  status: string;
  clientProfileId: string;
  subject: string | null;
  body: string | null;
  assignedVaId: string | null;
};

async function authorizePitch(
  pitchId: string
): Promise<{ ok: false; error: string } | { ok: true; pitch: AuthedPitch; userId: string }> {
  const me = await getCurrentUser();
  if (!me || (me.role !== 'va' && me.role !== 'admin')) {
    return { ok: false, error: 'Not authorized' };
  }
  const rows = await db
    .select({
      id: pitches.id,
      status: pitches.status,
      clientProfileId: pitches.clientProfileId,
      subject: pitches.subject,
      body: pitches.body,
      assignedVaId: clientProfiles.assignedVaId,
    })
    .from(pitches)
    .innerJoin(clientProfiles, eq(pitches.clientProfileId, clientProfiles.id))
    .where(eq(pitches.id, pitchId))
    .limit(1);

  const pitch = rows[0];
  if (!pitch) return { ok: false, error: 'Pitch not found' };
  if (me.role === 'va' && pitch.assignedVaId !== me.id) {
    return { ok: false, error: 'Not assigned to this client' };
  }
  return { ok: true, pitch, userId: me.id };
}

/** Approve a draft: mark queued and hand it to the send pipeline (Tue/Wed/Thu cadence). */
export async function approvePitch(pitchId: string): Promise<ActionResult> {
  const auth = await authorizePitch(pitchId);
  if (!auth.ok) return { error: auth.error };
  const { pitch } = auth;

  if (pitch.status !== 'draft') return { error: `Pitch is already ${pitch.status}.` };
  if (!pitch.subject || !pitch.body) return { error: 'Pitch has no subject/body yet.' };

  await db.update(pitches).set({ status: 'queued', updatedAt: new Date() }).where(eq(pitches.id, pitchId));
  await inngest.send({ name: 'pitch.queued_for_send', data: { pitchId } });

  revalidatePath(`/va/clients/${pitch.clientProfileId}/review`);
  return { ok: true };
}

/** Approve several drafts at once. */
export async function approvePitches(pitchIds: string[]): Promise<ActionResult> {
  const me = await getCurrentUser();
  if (!me || (me.role !== 'va' && me.role !== 'admin')) return { error: 'Not authorized' };
  if (pitchIds.length === 0) return { error: 'Nothing to approve.' };

  const rows = await db
    .select({
      id: pitches.id,
      status: pitches.status,
      clientProfileId: pitches.clientProfileId,
      subject: pitches.subject,
      body: pitches.body,
      assignedVaId: clientProfiles.assignedVaId,
    })
    .from(pitches)
    .innerJoin(clientProfiles, eq(pitches.clientProfileId, clientProfiles.id))
    .where(inArray(pitches.id, pitchIds));

  const approvable = rows.filter(
    (p) =>
      p.status === 'draft' &&
      p.subject &&
      p.body &&
      (me.role === 'admin' || p.assignedVaId === me.id)
  );
  if (approvable.length === 0) return { error: 'No approvable drafts in that set.' };

  await db
    .update(pitches)
    .set({ status: 'queued', updatedAt: new Date() })
    .where(inArray(pitches.id, approvable.map((p) => p.id)));

  await Promise.all(
    approvable.map((p) => inngest.send({ name: 'pitch.queued_for_send', data: { pitchId: p.id } }))
  );

  const clientId = approvable[0].clientProfileId;
  revalidatePath(`/va/clients/${clientId}/review`);
  return { ok: true };
}

/** Edit a draft's subject/body before approval; appends to draft_history. */
export async function updatePitchDraft(
  pitchId: string,
  subject: string,
  body: string
): Promise<ActionResult> {
  const auth = await authorizePitch(pitchId);
  if (!auth.ok) return { error: auth.error };
  const { pitch, userId } = auth;

  if (pitch.status !== 'draft') return { error: 'Only drafts can be edited.' };
  if (body.includes('—') || subject.includes('—')) {
    return { error: 'Remove em dashes before saving (house style).' };
  }

  const current = await db.query.pitches.findFirst({ where: eq(pitches.id, pitchId) });
  const history = current?.draftHistory ?? [];

  await db
    .update(pitches)
    .set({
      subject,
      body,
      draftHistory: [
        ...history,
        {
          version: history.length + 1,
          subject: current?.subject ?? '',
          body: current?.body ?? '',
          editedAt: new Date().toISOString(),
          editedBy: userId,
        },
      ],
      updatedAt: new Date(),
    })
    .where(eq(pitches.id, pitchId));

  revalidatePath(`/va/clients/${pitch.clientProfileId}/review`);
  return { ok: true };
}

/** Reject a draft: remove it from the queue entirely. */
export async function rejectPitch(pitchId: string): Promise<ActionResult> {
  const auth = await authorizePitch(pitchId);
  if (!auth.ok) return { error: auth.error };
  const { pitch } = auth;

  if (pitch.status !== 'draft') return { error: 'Only drafts can be rejected.' };
  await db.delete(pitches).where(eq(pitches.id, pitchId));

  revalidatePath(`/va/clients/${pitch.clientProfileId}/review`);
  return { ok: true };
}
