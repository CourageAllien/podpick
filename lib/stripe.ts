/**
 * PodPick — Stripe v3
 *
 * Pricing model:
 *  - $15 paid 7-day "trial" (a real charge, not free trial)
 *  - On day 7: subscription transitions to Standard ($99/mo) or Pro ($199/mo)
 *  - Implemented as a single subscription with `add_invoice_items` for the trial charge
 *    OR as separate trial product → main subscription via webhook
 *
 * The simplest implementation: charge $15 at signup, then create the main
 * subscription with trial_period_days=7. Stripe handles the conversion.
 */

import Stripe from 'stripe';
import { db } from '@/db';
import { subscriptions, clientProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { inngest } from '@/inngest/client';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
});

const PRICE_IDS = {
  trial: process.env.STRIPE_TRIAL_PRICE_ID!,        // $15 one-time
  standard: process.env.STRIPE_STANDARD_PRICE_ID!,  // $99/mo
  pro: process.env.STRIPE_PRO_PRICE_ID!,            // $199/mo
};

const QUOTAS = {
  standard: parseInt(process.env.STANDARD_QUOTA || '10', 10),
  pro: parseInt(process.env.PRO_QUOTA || '25', 10),
};

// ───────────────────────────────────────────────────────────────
// CHECKOUT SESSION — $15 trial + main subscription
// ───────────────────────────────────────────────────────────────

export async function createCheckoutSession(params: {
  email: string;
  tier: 'standard' | 'pro';
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}): Promise<{ url: string }> {
  const mainPriceId = params.tier === 'pro' ? PRICE_IDS.pro : PRICE_IDS.standard;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: params.email,
    line_items: [
      { price: mainPriceId, quantity: 1 },
    ],
    subscription_data: {
      trial_period_days: 7,
      trial_settings: {
        end_behavior: { missing_payment_method: 'cancel' },
      },
      metadata: { tier: params.tier, ...(params.metadata || {}) },
    },
    payment_method_collection: 'always',
    // The $15 charge happens via add_invoice_items on the trial-end invoice
    // For simplicity here, we charge the $15 separately at signup via PaymentIntent
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata || {},
  });

  if (!session.url) throw new Error('Stripe did not return a checkout URL');
  return { url: session.url };
}

// ───────────────────────────────────────────────────────────────
// WEBHOOK HANDLERS
// ───────────────────────────────────────────────────────────────

export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const stripeSubscriptionId = session.subscription as string;
  const customerId = session.customer as string;

  const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  const tier = (sub.metadata?.tier || 'standard') as 'standard' | 'pro';
  const quota = QUOTAS[tier];

  // Look up client by metadata or email
  const clientProfileId = session.metadata?.clientProfileId;
  if (!clientProfileId) {
    console.error('No clientProfileId in checkout session metadata');
    return;
  }

  await db.insert(subscriptions).values({
    clientProfileId,
    stripeCustomerId: customerId,
    stripeSubscriptionId,
    stripePriceId: sub.items.data[0].price.id,
    tier,
    status: 'trialing',
    monthlyPitchQuota: quota,
    pitchesUsedThisPeriod: 0,
    currentPeriodStart: new Date(sub.current_period_start * 1000),
    currentPeriodEnd: new Date(sub.current_period_end * 1000),
    trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
  });

  // Emit signup event for onboarding email chain
  await inngest.send({
    name: 'client.signup',
    data: { clientProfileId },
  });
}

export async function handleSubscriptionUpdated(
  sub: Stripe.Subscription
): Promise<void> {
  const tier = (sub.metadata?.tier || 'standard') as 'standard' | 'pro';
  const quota = QUOTAS[tier];

  // Status mapping from Stripe to our enum
  const statusMap: Record<string, 'trialing' | 'active' | 'past_due' | 'canceled'> = {
    trialing: 'trialing',
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    incomplete: 'past_due',
    incomplete_expired: 'canceled',
    unpaid: 'past_due',
  };
  const status = statusMap[sub.status] || 'past_due';

  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeSubscriptionId, sub.id),
  });

  if (!existing) return;

  await db.update(subscriptions)
    .set({
      status,
      tier,
      monthlyPitchQuota: quota,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, sub.id));

  await db.update(clientProfiles)
    .set({
      status: status === 'canceled' ? 'canceled' :
              status === 'trialing' ? 'trialing' : 'active',
      updatedAt: new Date(),
    })
    .where(eq(clientProfiles.id, existing.clientProfileId));

  // Trigger transition events
  if (existing.status === 'trialing' && status === 'active') {
    await inngest.send({
      name: 'client.subscription_renewed',
      data: { clientProfileId: existing.clientProfileId },
    });
  }

  if (status === 'canceled' && existing.status !== 'canceled') {
    await inngest.send({
      name: 'client.subscription_canceled',
      data: { clientProfileId: existing.clientProfileId },
    });
  }
}

// ───────────────────────────────────────────────────────────────
// DUNNING — failed payment + recovery
// ───────────────────────────────────────────────────────────────

/**
 * A renewal charge failed. Stripe's smart retries keep attempting payment, so
 * our job is to mark the subscription past_due and emit a dunning event so the
 * client gets a heads-up email escalating with each attempt. We never cut off
 * service here — that happens only when Stripe finally cancels the sub, which
 * arrives via customer.subscription.updated/deleted.
 */
export async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  const stripeSubscriptionId =
    typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id;
  if (!stripeSubscriptionId) return;

  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId),
  });
  if (!existing) return;

  await db.update(subscriptions)
    .set({ status: 'past_due', updatedAt: new Date() })
    .where(eq(subscriptions.id, existing.id));

  await inngest.send({
    name: 'client.payment_failed',
    data: {
      clientProfileId: existing.clientProfileId,
      attemptCount: invoice.attempt_count ?? 1,
      nextAttemptAt: invoice.next_payment_attempt
        ? new Date(invoice.next_payment_attempt * 1000).toISOString()
        : null,
    },
  });
}

/**
 * A previously failed invoice was paid (retry succeeded or card updated). Lift
 * the past_due flag back to active and let the client know service continues.
 */
export async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice
): Promise<void> {
  const stripeSubscriptionId =
    typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id;
  if (!stripeSubscriptionId) return;

  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId),
  });
  if (!existing) return;

  // Only act on recovery from a dunning state — normal renewals are handled
  // by resetQuotaOnPeriodRollover via invoice.paid.
  if (existing.status !== 'past_due') return;

  await db.update(subscriptions)
    .set({ status: 'active', updatedAt: new Date() })
    .where(eq(subscriptions.id, existing.id));

  await db.update(clientProfiles)
    .set({ status: 'active', updatedAt: new Date() })
    .where(eq(clientProfiles.id, existing.clientProfileId));

  await inngest.send({
    name: 'client.payment_recovered',
    data: { clientProfileId: existing.clientProfileId },
  });
}

// ───────────────────────────────────────────────────────────────
// QUOTA RESET ON PERIOD ROLLOVER
// ───────────────────────────────────────────────────────────────

export async function resetQuotaOnPeriodRollover(
  stripeSubscriptionId: string,
  newPeriodStart: Date,
  newPeriodEnd: Date
): Promise<void> {
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId),
  });
  if (!sub) return;

  await db.update(subscriptions)
    .set({
      pitchesUsedThisPeriod: 0,
      currentPeriodStart: newPeriodStart,
      currentPeriodEnd: newPeriodEnd,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));

  // Trigger monthly recap for the period that just ended
  await inngest.send({
    name: 'client.period_rollover',
    data: {
      clientProfileId: sub.clientProfileId,
      periodEnd: newPeriodStart.toISOString(),
    },
  });
}
