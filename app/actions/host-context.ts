'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { clientProfiles, hostPersonalContexts, podcasts } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';

/**
 * VA-facing host personal context editor. Host context powers Step 2 (host-based)
 * pitches; no automated scraper is wired, so a VA fills this in from the client
 * workspace. Saving with hasSufficientContext=true is what unlocks Step 2 for that
 * host, so the action re-checks VA assignment before writing.
 */

type ActionResult = { ok: true } | { error: string };

type RecentPost = {
  source: 'linkedin' | 'substack' | 'twitter' | 'medium' | 'other';
  title: string;
  body: string;
  url: string;
  date: string;
};

type InterviewQuote = { source: string; quote: string; url?: string; context?: string };

export type SaveHostContextInput = {
  clientProfileId: string; // for authorization + revalidation path
  podcastId: string;
  hostName?: string;
  linkedinUrl?: string;
  linkedinSummary?: string;
  substackUrl?: string;
  personalJourney?: string;
  recentPosts?: RecentPost[];
  interviewQuotes?: InterviewQuote[];
  hasSufficientContext: boolean;
};

async function authorizeClient(
  clientProfileId: string
): Promise<{ ok: false; error: string } | { ok: true }> {
  const me = await getCurrentUser();
  if (!me || (me.role !== 'va' && me.role !== 'admin')) {
    return { ok: false, error: 'Not authorized' };
  }
  if (me.role === 'admin') return { ok: true };

  const client = await db.query.clientProfiles.findFirst({
    where: eq(clientProfiles.id, clientProfileId),
  });
  if (!client) return { ok: false, error: 'Client not found' };
  if (client.assignedVaId !== me.id) return { ok: false, error: 'Not assigned to this client' };
  return { ok: true };
}

export async function saveHostContext(input: SaveHostContextInput): Promise<ActionResult> {
  const auth = await authorizeClient(input.clientProfileId);
  if (!auth.ok) return { error: auth.error };

  const podcast = await db.query.podcasts.findFirst({
    where: eq(podcasts.id, input.podcastId),
  });
  if (!podcast) return { error: 'Podcast not found.' };

  // Clean the structured arrays — drop empty rows the VA left blank.
  const recentPosts = (input.recentPosts ?? []).filter((p) => p.body.trim() || p.url.trim());
  const interviewQuotes = (input.interviewQuotes ?? []).filter((q) => q.quote.trim());

  // Guard against marking sufficient with nothing on file — Step 2 needs material.
  const hasAnyMaterial =
    Boolean(input.linkedinSummary?.trim()) ||
    Boolean(input.personalJourney?.trim()) ||
    recentPosts.length > 0 ||
    interviewQuotes.length > 0;
  if (input.hasSufficientContext && !hasAnyMaterial) {
    return {
      error:
        'Cannot mark "sufficient for Step 2" with no material. Add at least one post, quote, journey, or LinkedIn summary first.',
    };
  }

  const values = {
    hostName: input.hostName?.trim() || podcast.hostName || null,
    linkedinUrl: input.linkedinUrl?.trim() || null,
    linkedinSummary: input.linkedinSummary?.trim() || null,
    substackUrl: input.substackUrl?.trim() || null,
    personalJourney: input.personalJourney?.trim() || null,
    recentPosts,
    interviewQuotes,
    hasSufficientContext: input.hasSufficientContext,
    lastRefreshedAt: new Date(),
    updatedAt: new Date(),
  };

  await db
    .insert(hostPersonalContexts)
    .values({ podcastId: input.podcastId, ...values })
    .onConflictDoUpdate({
      target: hostPersonalContexts.podcastId,
      set: values,
    });

  revalidatePath(`/va/clients/${input.clientProfileId}/hosts`);
  return { ok: true };
}
