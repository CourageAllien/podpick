import { and, eq, lt, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { pitches, podcasts, hostPersonalContexts } from '@/db/schema';
import type { ToolDefinition } from '@/lib/agent/types';

type EligibleInput = { silent_days?: number };

const DEFAULT_SILENT_DAYS = 10;

/**
 * Tool 14 — get_step2_eligible_hosts
 * Surfaces the hosts who are ready for a Step 2 (host-based) follow-up: the client
 * sent them a Step 1 (episode-based) pitch, it went silent (no reply) for at least
 * `silent_days`, the podcast has sufficient host personal context on file, and no
 * Step 2 has already been written for that host/client pair.
 *
 * Step 2 is the second, more personal touch — it is only earned after a Step 1 has
 * had time to land and didn't. This tool is the gate that enforces that sequence so
 * the agent never double-pitches or jumps to Step 2 cold.
 */
export const getStep2EligibleHosts: ToolDefinition<EligibleInput> = {
  name: 'get_step2_eligible_hosts',
  description:
    "List hosts eligible for a Step 2 (host-based) follow-up for the active client: those who received a Step 1 pitch that went silent (no reply) for at least silent_days (default 10), whose podcast has sufficient host personal context on file, and who have not already been sent a Step 2. Returns each with the original Step 1 pitch_id (use as parent_pitch_id when generating Step 2).",
  inputSchema: {
    type: 'object',
    properties: {
      silent_days: {
        type: 'number',
        description: 'Minimum days since the Step 1 was sent with no reply (default 10).',
      },
    },
    required: [],
  },
  async execute(input, ctx) {
    const silentDays = input.silent_days ?? DEFAULT_SILENT_DAYS;
    const cutoff = new Date(Date.now() - silentDays * 24 * 60 * 60 * 1000);

    // Silent Step 1 prospects: sent step1, not replied, sent before the cutoff.
    const step1Sent = await db
      .select({
        pitchId: pitches.id,
        podcastId: pitches.podcastId,
        sentAt: pitches.sentAt,
        status: pitches.status,
      })
      .from(pitches)
      .where(
        and(
          eq(pitches.clientProfileId, ctx.clientProfileId),
          eq(pitches.step, 'step1'),
          eq(pitches.status, 'sent'),
          lt(pitches.sentAt, cutoff)
        )
      );

    if (step1Sent.length === 0) {
      return {
        silent_days: silentDays,
        eligible: [],
        message: 'No silent Step 1 pitches old enough for a Step 2 follow-up yet.',
      };
    }

    // Podcasts already pitched at Step 2 for this client — exclude them.
    const step2Already = await db
      .select({ podcastId: pitches.podcastId })
      .from(pitches)
      .where(
        and(eq(pitches.clientProfileId, ctx.clientProfileId), eq(pitches.step, 'step2'))
      );
    const step2PodcastIds = new Set(step2Already.map((p) => p.podcastId));

    // Keep the earliest silent Step 1 per podcast (the original first touch).
    const byPodcast = new Map<string, { pitchId: string; sentAt: Date | null }>();
    for (const row of step1Sent) {
      if (step2PodcastIds.has(row.podcastId)) continue;
      const existing = byPodcast.get(row.podcastId);
      if (!existing || (row.sentAt && existing.sentAt && row.sentAt < existing.sentAt)) {
        byPodcast.set(row.podcastId, { pitchId: row.pitchId, sentAt: row.sentAt });
      }
    }

    const candidatePodcastIds = [...byPodcast.keys()];
    if (candidatePodcastIds.length === 0) {
      return {
        silent_days: silentDays,
        eligible: [],
        message: 'All silent Step 1 prospects have already received a Step 2.',
      };
    }

    // Only hosts with sufficient personal context on file are eligible.
    const contexts = await db
      .select({
        podcastId: hostPersonalContexts.podcastId,
        hasSufficientContext: hostPersonalContexts.hasSufficientContext,
      })
      .from(hostPersonalContexts)
      .where(inArray(hostPersonalContexts.podcastId, candidatePodcastIds));
    const sufficientPodcastIds = new Set(
      contexts.filter((c) => c.hasSufficientContext).map((c) => c.podcastId)
    );

    const eligiblePodcastIds = candidatePodcastIds.filter((id) => sufficientPodcastIds.has(id));
    const missingContextCount = candidatePodcastIds.length - eligiblePodcastIds.length;

    if (eligiblePodcastIds.length === 0) {
      return {
        silent_days: silentDays,
        eligible: [],
        candidates_missing_host_context: missingContextCount,
        message:
          'There are silent Step 1 prospects, but none have host personal context on file yet. A VA must add host context before Step 2.',
      };
    }

    const podcastRows = await db
      .select({ id: podcasts.id, title: podcasts.title, hostName: podcasts.hostName })
      .from(podcasts)
      .where(inArray(podcasts.id, eligiblePodcastIds));
    const podcastById = new Map(podcastRows.map((p) => [p.id, p]));

    const eligible = eligiblePodcastIds.map((podcastId) => {
      const first = byPodcast.get(podcastId)!;
      const pod = podcastById.get(podcastId);
      const daysSilent = first.sentAt
        ? Math.floor((Date.now() - new Date(first.sentAt).getTime()) / (24 * 60 * 60 * 1000))
        : null;
      return {
        podcast_id: podcastId,
        podcast_title: pod?.title ?? 'Unknown podcast',
        host_name: pod?.hostName ?? null,
        parent_pitch_id: first.pitchId,
        step1_sent_at: first.sentAt ? new Date(first.sentAt).toISOString() : null,
        days_silent: daysSilent,
      };
    });

    return {
      silent_days: silentDays,
      eligible,
      candidates_missing_host_context: missingContextCount,
    };
  },
};
