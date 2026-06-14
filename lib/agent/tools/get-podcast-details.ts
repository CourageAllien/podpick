import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { podcasts } from '@/db/schema';
import type { ToolDefinition } from '@/lib/agent/types';

type DetailsInput = { podcast_id: string };

/**
 * Tool 6 — get_podcast_details
 * Full detail for one podcast, including recent episodes (so the agent can pick an
 * episode to reference in a Step 1 pitch) and audience demographics.
 */
export const getPodcastDetails: ToolDefinition<DetailsInput> = {
  name: 'get_podcast_details',
  description:
    'Get full details for one podcast by internal podcast_id: host, audience size, demographics, website, and recent episodes (with index, so you can choose which episode a Step 1 pitch references).',
  inputSchema: {
    type: 'object',
    properties: {
      podcast_id: { type: 'string', description: 'Internal podcast ID.' },
    },
    required: ['podcast_id'],
  },
  async execute(input) {
    const p = await db.query.podcasts.findFirst({
      where: eq(podcasts.id, input.podcast_id),
    });
    if (!p) return { error: 'Podcast not found for that ID.' };

    const episodes = (p.recentEpisodes ?? []).map((e, i) => ({
      index: i, // 0 = latest — matches generate_pitches episode_to_reference
      title: e.title,
      pub_date: e.pubDate,
      summary: e.description?.slice(0, 400) ?? '',
    }));

    return {
      podcast_id: p.id,
      title: p.title,
      host_name: p.hostName ?? null,
      host_emails: p.hostEmails ?? [],
      description: p.description ?? '',
      category: p.category ?? [],
      country: p.country ?? null,
      language: p.language ?? null,
      audience_size_estimate: p.audienceSizeEstimate ?? null,
      audience_demographics: p.audienceDemographics ?? null,
      website_url: p.websiteUrl ?? null,
      recent_episodes: episodes,
      last_synced_at: p.lastSyncedAt?.toISOString() ?? null,
    };
  },
};
