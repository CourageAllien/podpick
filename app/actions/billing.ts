'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { subscriptions } from '@/db/schema';
import { getCurrentClientProfile } from '@/lib/auth';
import { stripe } from '@/lib/stripe';

/**
 * Client-facing subscription controls. Cancellation is always scheduled for the
 * end of the current paid period (never an immediate cut-off) so the client gets
 * the service they already paid for. Stripe owns the source of truth; we mirror
 * the cancel_at_period_end flag locally for an instant UI update and let the
 * webhook reconcile the rest.
 */

type ActionResult = { ok: true } | { error: string };

async function loadOwnSub() {
  const profile = await getCurrentClientProfile();
  if (!profile) return { ok: false as const, error: 'Not signed in.' };
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.clientProfileId, profile.id),
  });
  if (!sub) return { ok: false as const, error: 'No subscription found.' };
  return { ok: true as const, profile, sub };
}

export async function cancelAtPeriodEnd(): Promise<ActionResult> {
  const ctx = await loadOwnSub();
  if (!ctx.ok) return { error: ctx.error };
  const { sub } = ctx;

  if (sub.status === 'canceled') {
    return { error: 'This subscription is already canceled.' };
  }

  try {
    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  } catch {
    return { error: 'Could not reach billing. Please try again in a moment.' };
  }

  await db
    .update(subscriptions)
    .set({ cancelAtPeriodEnd: true, updatedAt: new Date() })
    .where(eq(subscriptions.id, sub.id));

  revalidatePath('/app');
  return { ok: true };
}

export async function reactivateSubscription(): Promise<ActionResult> {
  const ctx = await loadOwnSub();
  if (!ctx.ok) return { error: ctx.error };
  const { sub } = ctx;

  if (!sub.cancelAtPeriodEnd) {
    return { error: 'Your subscription is already active.' };
  }

  try {
    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });
  } catch {
    return { error: 'Could not reach billing. Please try again in a moment.' };
  }

  await db
    .update(subscriptions)
    .set({ cancelAtPeriodEnd: false, updatedAt: new Date() })
    .where(eq(subscriptions.id, sub.id));

  revalidatePath('/app');
  return { ok: true };
}
