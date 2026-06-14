import { and, eq, inArray, asc } from 'drizzle-orm';
import { db } from '@/db';
import { podcastSuggestions, podcasts, pitches } from '@/db/schema';
import type { ToolDefinition } from '@/lib/agent/types';

type ListInput = { limit?: number };

/**
 * Tool 5 — list_unpitched_podcasts
 * Podcasts already suggested/ranked for this client that have NOT yet been pitched.
 * This is the agent's working set when the VA says "generate this week's pitches".
 */
export const listUnpitchedPodcasts: ToolDefinition<ListInput> = {
  name: 'list_unpitched_podcasts',
  description:
    'List podcasts that have been suggested/ranked for the active client but not yet pitched. Returns them in rank order. Use this to pick targets for new pitches without repeating a podcast.',
  inputSchema: {
    type: 'object',
    properties: { limit: { type: 'number', description: 'Max results (default 20)' } },
  },
  async execute(input, ctx) {
    const limit = input.limit ?? 20;

    // Podcasts already pitched for this client (exclude them).
    const pitched = await db
      .select({ podcastId: pitches.podcastId })
      .from(pitches)
      .where(eq(pitches.clientProfileId, ctx.clientProfileId));
    const pitchedIds = new Set(pitched.map((p) => p.podcastId));

    const suggestions = await db
      .select({
        rank: podcastSuggestions.rank,
        reason: podcastSuggestions.reason,
        status: podcastSuggestions.status,
        podcastId: podcasts.id,
        title: podcasts.title,
        hostName: podcasts.hostName,
        audienceSizeEstimate: podcasts.audienceSizeEstimate,
      })
      .from(podcastSuggestions)
      .innerJoin(podcasts, eq(podcastSuggestions.podcastId, podcasts.id))
      .where(
        and(
          eq(podcastSuggestions.clientProfileId, ctx.clientProfileId),
          inArray(podcastSuggestions.status, ['suggested', 'queued'])
        )
      )
      .orderBy(asc(podcastSuggestions.rank));

    const unpitched = suggestions.filter((s) => !pitchedIds.has(s.podcastId)).slice(0, limit);

    return {
      count: unpitched.length,
      podcasts: unpitched.map((s) => ({
        podcast_id: s.podcastId,
        rank: s.rank,
        title: s.title,
        host_name: s.hostName ?? null,
        audience_size_estimate: s.audienceSizeEstimate ?? null,
        reason: s.reason,
        status: s.status,
      })),
    };
  },
};
