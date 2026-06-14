import Anthropic from '@anthropic-ai/sdk';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { clientProfiles, podcasts, hostPersonalContexts } from '@/db/schema';
import type { ToolDefinition } from '@/lib/agent/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = 'claude-sonnet-4-5';

type MatchInput = { podcast_id: string };

/**
 * Tool 13 — match_client_story_to_host
 * The honesty gate for Step 2. Before a host-based pitch is written, this pre-pass
 * reads the client's real intake story (bio, angles, journey, topics) and the
 * host's cached personal material, and asks Claude to find a GENUINE bridge — a
 * specific chapter of the client's story that authentically connects to something
 * the host has actually said or lived.
 *
 * It is deliberately allowed to return no_match. A forced or invented connection
 * is the failure mode we are protecting against: a fabricated Step 2 bridge reads
 * as flattery and burns the prospect. If there is no honest anchor, the agent
 * should skip Step 2 for this host rather than manufacture one.
 */
export const matchClientStoryToHost: ToolDefinition<MatchInput> = {
  name: 'match_client_story_to_host',
  description:
    "Before writing a Step 2 (host-based) pitch, find an HONEST bridge between the client's real story and the host's personal material. Returns matched=true with a client_story_anchor (the specific chapter of the client's story that genuinely connects) and the matched host excerpt, OR matched=false with a no_match_reason. Never invent a connection — if matched is false, skip Step 2 for this host.",
  inputSchema: {
    type: 'object',
    properties: {
      podcast_id: { type: 'string', description: 'Internal podcast ID of the host to match against.' },
    },
    required: ['podcast_id'],
  },
  async execute(input, ctx) {
    const client = await db.query.clientProfiles.findFirst({
      where: eq(clientProfiles.id, ctx.clientProfileId),
    });
    if (!client) return { error: 'Client profile not found.' };

    const podcast = await db.query.podcasts.findFirst({
      where: eq(podcasts.id, input.podcast_id),
    });
    if (!podcast) return { error: 'Podcast not found for that ID.' };

    const ctxRow = await db.query.hostPersonalContexts.findFirst({
      where: eq(hostPersonalContexts.podcastId, input.podcast_id),
    });
    if (!ctxRow || !ctxRow.hasSufficientContext) {
      return {
        podcast_id: input.podcast_id,
        matched: false,
        no_match_reason:
          'No sufficient host personal context on file. A VA must add the host material before a Step 2 bridge can be evaluated.',
      };
    }

    const clientStory = {
      company: client.company,
      one_line_bio: client.oneLineBio,
      long_bio: client.longBio,
      topics: client.topics ?? [],
      angles: (client.angles ?? []).map((a) => ({ title: a.title, description: a.description })),
      target_audience: client.targetAudience,
      goals: client.goals,
      years_in_business: client.yearsInBusiness,
      revenue_range: client.revenueRange,
    };

    const hostMaterial = {
      host_name: ctxRow.hostName ?? podcast.hostName ?? 'the host',
      linkedin_summary: ctxRow.linkedinSummary ?? undefined,
      recent_posts: (ctxRow.recentPosts ?? []).map((p) => ({
        source: p.source,
        title: p.title,
        body: p.body,
        url: p.url,
      })),
      interview_quotes: ctxRow.interviewQuotes ?? [],
      personal_journey: ctxRow.personalJourney ?? undefined,
    };

    const prompt = `You are vetting whether a podcast guest (the CLIENT) has an HONEST, specific personal connection to a podcast HOST, for the purpose of writing a host-based outreach pitch.

This is an integrity check, not a sales task. Your job is to find a GENUINE bridge or to honestly report that none exists. A forced, generic, or flattering connection is WORSE than no connection. Only return a match if a real chapter of the client's story authentically resonates with something the host has actually said, written, or lived.

Reject as no-match if the only link is generic ("both are entrepreneurs", "both care about growth") or if you would have to invent or exaggerate to make it work.

CLIENT STORY:
${JSON.stringify(clientStory, null, 2)}

HOST PERSONAL MATERIAL:
${JSON.stringify(hostMaterial, null, 2)}

Return ONLY JSON, no commentary:
{
  "matched": <true|false>,
  "client_story_anchor": "<if matched: one or two sentences naming the SPECIFIC chapter of the client's story that connects>",
  "host_excerpt": "<if matched: the exact host quote/post text the anchor connects to>",
  "host_source_type": "<if matched: one of linkedin_post | substack | interview | article | journey>",
  "host_source_url": "<if matched and available: the url, else omit>",
  "reason": "<if matched: one sentence on why this bridge is honest and specific>",
  "no_match_reason": "<if not matched: one sentence on why there is no honest bridge>"
}`;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const text = textBlock && textBlock.type === 'text' ? textBlock.text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { error: 'Matcher returned no parseable output.' };

    let parsed: {
      matched: boolean;
      client_story_anchor?: string;
      host_excerpt?: string;
      host_source_type?: string;
      host_source_url?: string;
      reason?: string;
      no_match_reason?: string;
    };
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return { error: 'Matcher returned malformed JSON.' };
    }

    if (!parsed.matched || !parsed.client_story_anchor || !parsed.host_excerpt) {
      return {
        podcast_id: input.podcast_id,
        host_name: hostMaterial.host_name,
        matched: false,
        no_match_reason:
          parsed.no_match_reason ??
          "Couldn't find an honest bridge between the client's story and this host — skip Step 2 for this host.",
      };
    }

    const validSourceTypes = ['linkedin_post', 'substack', 'interview', 'article', 'journey'];
    const sourceType = validSourceTypes.includes(parsed.host_source_type ?? '')
      ? (parsed.host_source_type as string)
      : 'article';

    return {
      podcast_id: input.podcast_id,
      host_name: hostMaterial.host_name,
      matched: true,
      client_story_anchor: parsed.client_story_anchor,
      host_excerpt: parsed.host_excerpt,
      host_source_type: sourceType,
      host_source_url: parsed.host_source_url ?? null,
      reason: parsed.reason ?? null,
    };
  },
};
