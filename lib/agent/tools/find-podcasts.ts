import { inArray } from 'drizzle-orm';
import { db } from '@/db';
import { podcasts } from '@/db/schema';
import { searchPodcasts } from '@/lib/rephonic';
import type { ToolDefinition } from '@/lib/agent/types';

type FindPodcastsInput = {
  query?: string;
  categories?: string[];
  country?: string;
  language?: string;
  audience_min?: number;
  audience_max?: number;
  limit?: number;
};

/**
 * Tool 3 — find_podcasts
 * Rephonic discovery, then upserts each hit into our `podcasts` cache so the rows
 * have internal UUIDs the rest of the pipeline (rank, generate, pitch) can use.
 */
export const findPodcasts: ToolDefinition<FindPodcastsInput> = {
  name: 'find_podcasts',
  description:
    'Search for podcasts via Rephonic by keyword, category, country, language, and audience-size range. Results are cached locally and returned with internal podcast IDs. Use a tight audience range (for SaaS founders, usually under 25,000 listeners) unless the VA says otherwise.',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Keyword/topic search, e.g. "B2B SaaS marketing"' },
      categories: { type: 'array', items: { type: 'string' }, description: 'Rephonic category filters' },
      country: { type: 'string', description: 'ISO country code, e.g. "US"' },
      language: { type: 'string', description: 'Language code, e.g. "en"' },
      audience_min: { type: 'number', description: 'Minimum estimated listeners' },
      audience_max: { type: 'number', description: 'Maximum estimated listeners' },
      limit: { type: 'number', description: 'Max results (default 20)' },
    },
  },
  async execute(input) {
    const results = await searchPodcasts({
      query: input.query,
      categories: input.categories,
      country: input.country,
      language: input.language,
      audienceMin: input.audience_min,
      audienceMax: input.audience_max,
      limit: input.limit ?? 20,
    });

    if (results.length === 0) {
      return { count: 0, podcasts: [], message: 'No podcasts matched those filters.' };
    }

    // Upsert into our cache so each podcast has an internal UUID.
    for (const r of results) {
      await db
        .insert(podcasts)
        .values({
          rephonicId: r.rephonicId,
          title: r.title,
          description: r.description,
          hostName: r.hostName,
          hostEmails: r.hostEmails,
          category: r.category,
          country: r.country,
          language: r.language,
          audienceSizeEstimate: r.audienceSizeEstimate,
          rssUrl: r.rssUrl,
          websiteUrl: r.websiteUrl,
          audienceDemographics: r.audienceDemographics,
          recentEpisodes: r.recentEpisodes,
          lastSyncedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: podcasts.rephonicId,
          set: {
            title: r.title,
            description: r.description,
            hostName: r.hostName,
            audienceSizeEstimate: r.audienceSizeEstimate,
            recentEpisodes: r.recentEpisodes,
            lastSyncedAt: new Date(),
          },
        });
    }

    // Read back internal IDs.
    const rephonicIds = results.map((r) => r.rephonicId);
    const stored = await db
      .select({
        id: podcasts.id,
        rephonicId: podcasts.rephonicId,
        title: podcasts.title,
        hostName: podcasts.hostName,
        audienceSizeEstimate: podcasts.audienceSizeEstimate,
        category: podcasts.category,
      })
      .from(podcasts)
      .where(inArray(podcasts.rephonicId, rephonicIds));

    const byRephonic = new Map(stored.map((s) => [s.rephonicId, s]));

    return {
      count: results.length,
      podcasts: results.map((r) => {
        const s = byRephonic.get(r.rephonicId);
        return {
          podcast_id: s?.id ?? null,
          title: r.title,
          host_name: r.hostName ?? null,
          audience_size_estimate: r.audienceSizeEstimate ?? null,
          category: r.category ?? [],
          description: r.description?.slice(0, 240) ?? '',
        };
      }),
    };
  },
};
