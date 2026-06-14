import Anthropic from '@anthropic-ai/sdk';
import { eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { clientProfiles, podcasts, podcastSuggestions } from '@/db/schema';
import type { ToolDefinition } from '@/lib/agent/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = 'claude-sonnet-4-5';

type RankInput = { podcast_ids: string[] };

/**
 * Tool 4 — rank_podcasts_for_client
 * Scores candidate podcasts against the client's intake + ICP using Claude, then
 * persists the ranking into `podcast_suggestions` so the VA's review screen and
 * later pitch generation can reuse it.
 */
export const rankPodcastsForClient: ToolDefinition<RankInput> = {
  name: 'rank_podcasts_for_client',
  description:
    "Rank a set of candidate podcasts (by internal podcast_id) for the active client based on their intake, angles, target audience, and ICP. Returns each podcast with a fit score (0-100), rank, and a one-line reason, and saves the ranking for the review screen.",
  inputSchema: {
    type: 'object',
    properties: {
      podcast_ids: {
        type: 'array',
        items: { type: 'string' },
        description: 'Internal podcast IDs to rank (from find_podcasts).',
      },
    },
    required: ['podcast_ids'],
  },
  async execute(input, ctx) {
    if (!input.podcast_ids?.length) {
      return { error: 'Provide at least one podcast_id to rank.' };
    }

    const client = await db.query.clientProfiles.findFirst({
      where: eq(clientProfiles.id, ctx.clientProfileId),
    });
    if (!client) return { error: 'Client profile not found.' };

    const rows = await db
      .select({
        id: podcasts.id,
        title: podcasts.title,
        hostName: podcasts.hostName,
        description: podcasts.description,
        category: podcasts.category,
        audienceSizeEstimate: podcasts.audienceSizeEstimate,
      })
      .from(podcasts)
      .where(inArray(podcasts.id, input.podcast_ids));

    if (rows.length === 0) return { error: 'None of those podcast IDs were found.' };

    const clientSummary = {
      company: client.company,
      one_line_bio: client.oneLineBio,
      topics: client.topics ?? [],
      angles: (client.angles ?? []).map((a) => a.title),
      target_audience: client.targetAudience,
      goals: client.goals,
      revenue_range: client.revenueRange,
    };

    const prompt = `You are vetting podcasts for a bootstrapped SaaS founder client. Rank the candidates by how good a fit each is for THIS client to be a guest on. Reward shows whose audience overlaps the client's target audience and topics. For SaaS founders, smaller engaged shows (under ~25k listeners) usually convert better than huge generalist shows; weight relevance over raw size.

CLIENT:
${JSON.stringify(clientSummary, null, 2)}

CANDIDATE PODCASTS:
${rows
  .map(
    (p) =>
      `- id=${p.id} | "${p.title}" | host=${p.hostName ?? 'unknown'} | audience=${p.audienceSizeEstimate ?? 'unknown'} | categories=${(p.category ?? []).join(', ')} | ${(p.description ?? '').slice(0, 200)}`
  )
  .join('\n')}

Return ONLY JSON, no commentary:
{ "ranked": [ { "podcast_id": "<id>", "score": <0-100>, "reason": "<one sentence>" } ] }
Order the array best-fit first. Include every candidate exactly once.`;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const text = textBlock && textBlock.type === 'text' ? textBlock.text : '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { error: 'Ranking model returned no parseable output.' };

    let parsed: { ranked: Array<{ podcast_id: string; score: number; reason: string }> };
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      return { error: 'Ranking model returned malformed JSON.' };
    }

    const valid = parsed.ranked.filter((r) => rows.some((p) => p.id === r.podcast_id));

    // Persist suggestions (idempotent on client+podcast).
    let rank = 1;
    for (const r of valid) {
      await db
        .insert(podcastSuggestions)
        .values({
          clientProfileId: ctx.clientProfileId,
          podcastId: r.podcast_id,
          rank,
          reason: r.reason,
          status: 'suggested',
        })
        .onConflictDoUpdate({
          target: [podcastSuggestions.clientProfileId, podcastSuggestions.podcastId],
          set: { rank, reason: r.reason, updatedAt: new Date() },
        });
      rank++;
    }

    const titleById = new Map(rows.map((p) => [p.id, p.title]));
    return {
      ranked: valid.map((r, i) => ({
        rank: i + 1,
        podcast_id: r.podcast_id,
        title: titleById.get(r.podcast_id) ?? 'Unknown',
        score: r.score,
        reason: r.reason,
      })),
    };
  },
};
