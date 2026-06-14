'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { clientProfiles } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/stripe';

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 7);
}

/**
 * Ensures a stub client_profiles row exists, then creates a Stripe Checkout
 * Session for the $15 trial → tier subscription. Returns the redirect URL.
 *
 * The webhook (checkout.session.completed) links the subscription back to the
 * client via the clientProfileId we pass in metadata.
 */
export async function startCheckout(tier: 'standard' | 'pro'): Promise<{ url: string }> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  // Find or create the stub client profile
  let profile = await db.query.clientProfiles.findFirst({
    where: eq(clientProfiles.userId, user.id),
  });

  if (!profile) {
    const base = slugify(user.fullName || user.email.split('@')[0] || 'client');
    const slug = `${base || 'client'}-${randomSuffix()}`;
    const inserted = await db
      .insert(clientProfiles)
      .values({
        userId: user.id,
        slug,
        status: 'trialing',
        newSendingDomain: true,
      })
      .returning();
    profile = inserted[0];
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const { url } = await createCheckoutSession({
    email: user.email,
    tier,
    successUrl: `${appUrl}/app/intake?checkout=success`,
    cancelUrl: `${appUrl}/auth/checkout?tier=${tier}&canceled=1`,
    metadata: { clientProfileId: profile.id, tier },
  });

  return { url };
}
