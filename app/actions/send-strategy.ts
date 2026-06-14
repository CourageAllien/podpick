'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { clientProfiles, subscriptions, sendSchedules } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';

/**
 * VA/admin control over a client's automated send planning. Manual override
 * pauses the Monday auto-planner for the current period so a VA can hand-curate
 * the calendar (book launches, sensitive weeks, etc.) without the system
 * regenerating slots underneath them.
 */

type ActionResult = { ok: true } | { error: string };

async function authorize(clientProfileId: string) {
  const me = await getCurrentUser();
  if (!me || (me.role !== 'va' && me.role !== 'admin')) {
    return { ok: false as const, error: 'Not authorized.' };
  }
  const client = await db.query.clientProfiles.findFirst({
    where: eq(clientProfiles.id, clientProfileId),
  });
  if (!client) return { ok: false as const, error: 'Client not found.' };
  if (me.role === 'va' && client.assignedVaId !== me.id) {
    return { ok: false as const, error: 'Not assigned to this client.' };
  }
  return { ok: true as const, me, client };
}

export async function setManualOverride(
  clientProfileId: string,
  enabled: boolean
): Promise<ActionResult> {
  const auth = await authorize(clientProfileId);
  if (!auth.ok) return { error: auth.error };

  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.clientProfileId, clientProfileId),
  });
  if (!sub?.currentPeriodStart || !sub.currentPeriodEnd) {
    return { error: 'No active billing period to adjust.' };
  }

  const periodStart = new Date(sub.currentPeriodStart);
  const periodEnd = new Date(sub.currentPeriodEnd);

  const existing = await db.query.sendSchedules.findFirst({
    where: and(
      eq(sendSchedules.clientProfileId, clientProfileId),
      eq(sendSchedules.periodStart, periodStart)
    ),
  });

  if (existing) {
    await db
      .update(sendSchedules)
      .set({ manualOverride: enabled, updatedAt: new Date() })
      .where(eq(sendSchedules.id, existing.id));
  } else {
    await db.insert(sendSchedules).values({
      clientProfileId,
      periodStart,
      periodEnd,
      plannedSends: [],
      manualOverride: enabled,
    });
  }

  revalidatePath(`/va/clients/${clientProfileId}`);
  return { ok: true };
}
