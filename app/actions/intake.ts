'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { clientProfiles, users } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { inngest } from '@/inngest/client';
import { createOAuthLink } from '@/lib/unipile';
import { intakeSchema, type IntakeValues } from '@/app/(client)/app/intake/schema';

/**
 * Persists the full intake payload to client_profiles, marks intake complete,
 * and emits client.intake_completed so the onboarding email chain advances.
 */
export async function submitIntake(values: IntakeValues): Promise<{ ok: true } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Not authenticated' };

  const parsed = intakeSchema.safeParse(values);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || 'Invalid form data' };
  }
  const v = parsed.data;

  const profile = await db.query.clientProfiles.findFirst({
    where: eq(clientProfiles.userId, user.id),
  });
  if (!profile) return { error: 'No client profile found. Complete checkout first.' };

  // Fold an optional podcast-history link into past appearances
  const pastAppearances = [...(v.pastAppearances ?? [])];
  if (v.hasBeenOnPodcast && v.podcastHistoryLink) {
    pastAppearances.unshift({
      podcastName: 'Previous appearance',
      episodeUrl: v.podcastHistoryLink,
      date: undefined,
    });
  }

  // Combine multiple-choice goals with the free-text note
  const goals = [v.goals.join('; '), v.goalsNote?.trim()].filter(Boolean).join(' — ');

  await db.update(users).set({ fullName: v.fullName }).where(eq(users.id, user.id));

  await db
    .update(clientProfiles)
    .set({
      company: v.company,
      website: v.website || null,
      linkedinUrl: v.linkedinUrl,
      twitterUrl: v.twitterUrl || null,
      headshotUrl: v.headshotUrl || null,
      oneLineBio: v.oneLineBio,
      longBio: v.longBio,
      angles: v.angles,
      topics: v.topics.split(',').map((t) => t.trim()).filter(Boolean),
      targetAudience: v.targetAudience,
      goals,
      sampleQuestions: v.sampleQuestions.filter(Boolean),
      avoidTopics: v.avoidTopics || null,
      revenueRange: v.revenueRange,
      yearsInBusiness: v.yearsInBusiness,
      hasBeenOnPodcast: v.hasBeenOnPodcast,
      publicArtifactUrl: v.publicArtifactUrl,
      pastAppearances,
      unipileAccountId: v.unipileAccountId || profile.unipileAccountId || null,
      newSendingDomain: true,
      bookingLink: v.bookingLink,
      intakeCompletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(clientProfiles.id, profile.id));

  await inngest.send({
    name: 'client.intake_completed',
    data: { clientProfileId: profile.id },
  });

  return { ok: true };
}

/**
 * Generates a Unipile hosted-auth link so the client can connect their sending
 * inbox. On success Unipile redirects back to /api/unipile/oauth-callback.
 */
export async function startUnipileConnect(
  provider: 'GOOGLE' | 'OUTLOOK'
): Promise<{ url: string } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: 'Not authenticated' };

  const profile = await db.query.clientProfiles.findFirst({
    where: eq(clientProfiles.userId, user.id),
  });
  if (!profile) return { error: 'No client profile found' };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const result = await createOAuthLink({
    provider,
    clientProfileId: profile.id,
    successRedirectUrl: `${appUrl}/app/intake?unipile=connected`,
    failureRedirectUrl: `${appUrl}/app/intake?unipile=failed`,
  });

  if ('error' in result) return { error: result.error };
  return { url: result.url };
}
