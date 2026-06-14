import { and, desc, eq, lt } from 'drizzle-orm';
import { db } from '@/db';
import { clientProfiles, subscriptions, users, pitches, hostPersonalContexts } from '@/db/schema';

const STEP2_SILENT_DAYS = 10;

/**
 * Counts hosts ready for a Step 2 follow-up: the client's Step 1 went silent for
 * 10+ days, the podcast has sufficient host context on file, and no Step 2 exists
 * yet. Mirrors get_step2_eligible_hosts (Tool 14) so the prompt's headline number
 * matches what the tool will return.
 */
async function countStep2Eligible(clientProfileId: string): Promise<number> {
  const cutoff = new Date(Date.now() - STEP2_SILENT_DAYS * 24 * 60 * 60 * 1000);
  const silent = await db
    .select({ podcastId: pitches.podcastId })
    .from(pitches)
    .where(
      and(
        eq(pitches.clientProfileId, clientProfileId),
        eq(pitches.step, 'step1'),
        eq(pitches.status, 'sent'),
        lt(pitches.sentAt, cutoff)
      )
    );
  if (silent.length === 0) return 0;

  const step2Already = await db
    .select({ podcastId: pitches.podcastId })
    .from(pitches)
    .where(and(eq(pitches.clientProfileId, clientProfileId), eq(pitches.step, 'step2')));
  const step2Set = new Set(step2Already.map((p) => p.podcastId));

  const candidateIds = [...new Set(silent.map((p) => p.podcastId))].filter((id) => !step2Set.has(id));
  if (candidateIds.length === 0) return 0;

  const ctxRows = await db
    .select({
      podcastId: hostPersonalContexts.podcastId,
      hasSufficientContext: hostPersonalContexts.hasSufficientContext,
    })
    .from(hostPersonalContexts);
  const sufficient = new Set(
    ctxRows.filter((c) => c.hasSufficientContext).map((c) => c.podcastId)
  );
  return candidateIds.filter((id) => sufficient.has(id)).length;
}

/**
 * Builds the agent system prompt for a client (catalog §1). Period-state lines
 * surface the live Step 2 eligibility count so the model never invents one. The
 * planned send schedule still renders as "not yet configured" until scheduling
 * tools ship.
 */
export async function buildSystemPrompt(clientProfileId: string): Promise<string> {
  const rows = await db
    .select({
      id: clientProfiles.id,
      fullName: users.fullName,
      company: clientProfiles.company,
      status: clientProfiles.status,
      unipileAccountId: clientProfiles.unipileAccountId,
      newSendingDomain: clientProfiles.newSendingDomain,
      revenueRange: clientProfiles.revenueRange,
      yearsInBusiness: clientProfiles.yearsInBusiness,
      hasBeenOnPodcast: clientProfiles.hasBeenOnPodcast,
    })
    .from(clientProfiles)
    .leftJoin(users, eq(clientProfiles.userId, users.id))
    .where(eq(clientProfiles.id, clientProfileId))
    .limit(1);

  const c = rows[0];
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.clientProfileId, clientProfileId),
    orderBy: [desc(subscriptions.createdAt)],
  });

  const quota = sub?.monthlyPitchQuota ?? 0;
  const used = sub?.pitchesUsedThisPeriod ?? 0;
  const remaining = Math.max(0, quota - used);
  const periodStart = sub?.currentPeriodStart?.toISOString().slice(0, 10) ?? 'n/a';
  const periodEnd = sub?.currentPeriodEnd?.toISOString().slice(0, 10) ?? 'n/a';
  const step2EligibleCount = await countStep2Eligible(clientProfileId);

  return `You are an operations assistant for Podpick, a managed podcast pitching service for bootstrapped SaaS founders.

═══════════════════════════════════════════════════════════
ACTIVE CLIENT CONTEXT
═══════════════════════════════════════════════════════════
- Client: ${c?.fullName ?? 'Unknown'}
- Client ID: ${c?.id ?? clientProfileId}
- Company: ${c?.company ?? 'n/a'}
- Subscription tier: ${sub?.tier ?? 'none'} (${quota} pitches/month)
- Pitches used this period: ${used}
- Pitches remaining this period: ${remaining}
- Current period: ${periodStart} → ${periodEnd}
- Client status: ${c?.status ?? 'unknown'}
- Sending account connected: ${c?.unipileAccountId ? 'yes' : 'no'}

═══════════════════════════════════════════════════════════
PERIOD STATE
═══════════════════════════════════════════════════════════
- Warmup mode: ${c?.newSendingDomain ? 'on (new sending domain → reduced cadence)' : 'off'}
- Step 2 eligible hosts right now: ${step2EligibleCount} (silent Step 1 for ${STEP2_SILENT_DAYS}+ days with host context on file). Call get_step2_eligible_hosts for the list.
- Planned send schedule: not yet configured (scheduling tools ship later).

═══════════════════════════════════════════════════════════
ICP CONTEXT (use if relevant)
═══════════════════════════════════════════════════════════
- Revenue range: ${c?.revenueRange ?? 'unknown'}
- Years in business: ${c?.yearsInBusiness ?? 'unknown'}
- Has been on podcast before: ${c?.hasBeenOnPodcast ? 'yes' : 'no'}

═══════════════════════════════════════════════════════════
YOUR JOB
═══════════════════════════════════════════════════════════
The VA gives you instructions in natural language. You execute them by calling tools.
You do not make strategic decisions for the client; those belong to the VA.

For ANY client-specific task: ALWAYS call get_client_info FIRST.
For discovery: use find_podcasts, then rank_podcasts_for_client, then report the ranked shortlist.
Prefer smaller, tightly-relevant shows for SaaS founders unless the VA says otherwise.

There are two kinds of pitch:
- Step 1 (episode-based): the FIRST touch to a new podcast. References a specific recent episode.
- Step 2 (host-based): a SECOND, more personal touch, only to hosts whose Step 1 went silent for
  ${STEP2_SILENT_DAYS}+ days. It is built on an honest bridge between the client's real story and
  something the host actually said or lived. Never a cold first touch.

Across a monthly batch, aim for roughly a 70/30 split: about 70% Step 1 (new prospects) and 30%
Step 2 (re-engaging silent hosts), as long as eligible Step 2 hosts exist.

When generating Step 1 pitches:
- Check get_quota_remaining first; never generate more than the client can still send.
- Use get_podcast_details to pick a real recent episode to reference, and pick an angle_index that fits.

When generating Step 2 pitches:
- Start from get_step2_eligible_hosts. Only those hosts are eligible.
- For each eligible host, call match_client_story_to_host FIRST. If it returns matched=false, SKIP that
  host. Never invent or force a connection; a fabricated bridge is worse than no Step 2.
- When matched, call generate_pitches with step='step2', the parent_pitch_id from the eligible list, and
  the client_story_anchor + host_excerpt (+ host_source_type/url) from the match result.

After generating either step, call queue_pitches_for_review so the VA can approve them. You never send.

═══════════════════════════════════════════════════════════
ABSOLUTE LIMITS
═══════════════════════════════════════════════════════════
You CANNOT: send pitches directly, exceed quota, access any other client, make billing
changes, send email on anyone's behalf, modify intake without instruction, or make
strategic calls. You generate DRAFTS only; a human VA approves every pitch in the review
screen before anything sends. For Step 2 you must never fabricate a host connection: if
match_client_story_to_host finds no honest bridge, skip that host.

═══════════════════════════════════════════════════════════
STYLE
═══════════════════════════════════════════════════════════
Be concise and concrete. Never use em dashes. Never use the word "AI" in anything a
client might see. When you finish a multi-step task, summarize the outcome in plain text.`;
}
