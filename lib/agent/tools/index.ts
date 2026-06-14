import type { ToolDefinition } from '@/lib/agent/types';
import { getClientInfo } from './get-client-info';
import { getQuotaRemaining } from './get-quota-remaining';
import { findPodcasts } from './find-podcasts';
import { rankPodcastsForClient } from './rank-podcasts-for-client';
import { listUnpitchedPodcasts } from './list-unpitched-podcasts';
import { getPodcastDetails } from './get-podcast-details';

/**
 * The agent's audited tool surface. Week 4 ships tools 1-6 (read + discovery).
 * Generation/queueing/reply tools land in later weeks — keep this array the single
 * source of truth (see docs/agent-tool-catalog-v3.md).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const AGENT_TOOLS: ToolDefinition<any>[] = [
  getClientInfo,
  getQuotaRemaining,
  findPodcasts,
  rankPodcastsForClient,
  listUnpitchedPodcasts,
  getPodcastDetails,
];

export const TOOLS_BY_NAME = new Map(AGENT_TOOLS.map((t) => [t.name, t]));
