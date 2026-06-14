import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { podcasts, hostPersonalContexts } from '@/db/schema';
import type { ToolDefinition } from '@/lib/agent/types';

type FindInput = { podcast_id: string };

/**
 * Tool 12 — find_host_personal_context
 * Returns the host's personal material (LinkedIn/Substack posts, interview quotes,
 * journey) for Step 2 personalization. Reads the `host_personal_contexts` cache.
 *
 * No automated scraper is wired yet, so when nothing is on file this reports the
 * gap honestly (has_sufficient_context=false) rather than inventing material — a
 * VA populates host context from the client workspace. This guardrail is
 * deliberate: a fabricated Step 2 pitch is worse than no pitch.
 */
export const findHostPersonalContext: ToolDefinition<FindInput> = {
  name: 'find_host_personal_context',
  description:
    "Get a podcast host's personal material for a Step 2 (host-based) pitch: LinkedIn/Substack posts, interview quotes, and journey summary. Returns has_sufficient_context. If false, there is not enough public material on file for an honest Step 2 pitch, so skip that host.",
  inputSchema: {
    type: 'object',
    properties: {
      podcast_id: { type: 'string', description: 'Internal podcast ID.' },
    },
    required: ['podcast_id'],
  },
  async execute(input) {
    const podcast = await db.query.podcasts.findFirst({
      where: eq(podcasts.id, input.podcast_id),
    });
    if (!podcast) return { error: 'Podcast not found for that ID.' };

    const ctx = await db.query.hostPersonalContexts.findFirst({
      where: eq(hostPersonalContexts.podcastId, input.podcast_id),
    });

    if (!ctx) {
      return {
        podcast_id: input.podcast_id,
        host_name: podcast.hostName ?? null,
        has_sufficient_context: false,
        message:
          'No host personal context on file. A VA must add it from the client workspace before a Step 2 pitch can be written.',
      };
    }

    return {
      podcast_id: input.podcast_id,
      host_personal_context_id: ctx.id,
      host_name: ctx.hostName ?? podcast.hostName ?? null,
      has_sufficient_context: ctx.hasSufficientContext,
      context: {
        linkedin_url: ctx.linkedinUrl ?? undefined,
        linkedin_summary: ctx.linkedinSummary ?? undefined,
        substack_url: ctx.substackUrl ?? undefined,
        recent_posts: ctx.recentPosts ?? [],
        interview_quotes: ctx.interviewQuotes ?? [],
        personal_journey: ctx.personalJourney ?? undefined,
      },
      last_refreshed_at: ctx.lastRefreshedAt?.toISOString() ?? null,
    };
  },
};
