import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { clientProfiles, podcasts, pitches, subscriptions, hostPersonalContexts } from '@/db/schema';
import { generatePitch, type GenerationInput } from '@/lib/anthropic';
import type { ToolDefinition } from '@/lib/agent/types';

type HostSourceType = 'linkedin_post' | 'substack' | 'interview' | 'article' | 'journey';

type PitchRequest = {
  podcast_id: string;
  step?: 'step1' | 'step2';
  angle_index?: number; // 1-based into the client's angles
  episode_to_reference?: number; // 0 = latest (Step 1)
  tone?: 'professional' | 'casual' | 'sharp';
  length?: 'short' | 'medium' | 'long';

  // Step 2 only — supplied from match_client_story_to_host (Tool 13).
  parent_pitch_id?: string; // the silent Step 1 this follows up on
  client_story_anchor?: string; // the honest bridge chapter
  host_excerpt?: string; // the specific host material the anchor connects to
  host_source_type?: HostSourceType;
  host_source_url?: string;
};

type GenerateInput = { podcast_pitches: PitchRequest[] };

/**
 * Tool 7 — generate_pitches (Step 1 + Step 2 as of Week 6)
 * Bulk-generates draft pitches. For each request: creates a draft pitch row, then
 * runs the step-aware writer (lib/anthropic.generatePitch). Never exceeds the
 * client's remaining quota, and never sends — drafts land in the review queue.
 *
 * Step 1 references a recent episode. Step 2 is host-based: it requires the honest
 * bridge produced by match_client_story_to_host (Tool 13) plus the silent Step 1's
 * parent_pitch_id, and pulls the host material from host_personal_contexts.
 */
export const generatePitches: ToolDefinition<GenerateInput> = {
  name: 'generate_pitches',
  description:
    "Generate draft pitches for the active client against specific podcasts. Each item needs a podcast_id and an angle_index (1-based). Step 1 (default) references a recent episode (episode_to_reference, 0 = latest). Step 2 (host-based) requires parent_pitch_id (the silent Step 1, from get_step2_eligible_hosts) plus client_story_anchor and host_excerpt (from match_client_story_to_host). Drafts go to the VA review queue, never sent. Won't exceed remaining quota.",
  inputSchema: {
    type: 'object',
    properties: {
      podcast_pitches: {
        type: 'array',
        description: 'One entry per pitch to generate.',
        items: {
          type: 'object',
          properties: {
            podcast_id: { type: 'string' },
            step: { type: 'string', enum: ['step1', 'step2'] },
            angle_index: { type: 'number', description: '1-based index into the client angles' },
            episode_to_reference: { type: 'number', description: 'Step 1: 0 = latest episode' },
            tone: { type: 'string', enum: ['professional', 'casual', 'sharp'] },
            length: { type: 'string', enum: ['short', 'medium', 'long'] },
            parent_pitch_id: {
              type: 'string',
              description: 'Step 2: the silent Step 1 pitch_id this follows up on.',
            },
            client_story_anchor: {
              type: 'string',
              description: 'Step 2: the honest bridge from match_client_story_to_host.',
            },
            host_excerpt: {
              type: 'string',
              description: 'Step 2: the specific host material the anchor connects to.',
            },
            host_source_type: {
              type: 'string',
              enum: ['linkedin_post', 'substack', 'interview', 'article', 'journey'],
              description: 'Step 2: where the host material came from.',
            },
            host_source_url: { type: 'string', description: 'Step 2: optional source URL.' },
          },
          required: ['podcast_id'],
        },
      },
    },
    required: ['podcast_pitches'],
  },
  async execute(input, ctx) {
    const requests = input.podcast_pitches ?? [];
    if (requests.length === 0) return { error: 'No pitches requested.' };

    const client = await db.query.clientProfiles.findFirst({
      where: eq(clientProfiles.id, ctx.clientProfileId),
    });
    if (!client) return { error: 'Client profile not found.' };

    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.clientProfileId, ctx.clientProfileId),
      orderBy: [desc(subscriptions.createdAt)],
    });

    // Account for this client's drafts already waiting (informational only).
    const existingDrafts = await db
      .select({ id: pitches.id })
      .from(pitches)
      .where(
        and(
          eq(pitches.clientProfileId, ctx.clientProfileId),
          inArray(pitches.status, ['draft', 'queued', 'scheduled'])
        )
      );
    const pendingForClient = existingDrafts.length;

    const quota = sub?.monthlyPitchQuota ?? 0;
    const used = sub?.pitchesUsedThisPeriod ?? 0;
    const remaining = sub ? Math.max(0, quota - used) : Number.POSITIVE_INFINITY;

    const podcastIds = [...new Set(requests.map((r) => r.podcast_id))];
    const podcastRows = await db
      .select()
      .from(podcasts)
      .where(inArray(podcasts.id, podcastIds));
    const podcastById = new Map(podcastRows.map((p) => [p.id, p]));

    const angles = (client.angles ?? []) as Array<{ title: string; description: string }>;

    const generated: Array<Record<string, unknown>> = [];
    const failed: Array<{ podcast_id: string; step: string; reason: string }> = [];
    let producedThisCall = 0;

    for (const req of requests) {
      const step = req.step ?? 'step1';

      if (Number.isFinite(remaining) && producedThisCall >= (remaining as number)) {
        failed.push({ podcast_id: req.podcast_id, step, reason: 'quota_exhausted' });
        continue;
      }
      const podcast = podcastById.get(req.podcast_id);
      if (!podcast) {
        failed.push({ podcast_id: req.podcast_id, step, reason: 'podcast_not_found' });
        continue;
      }

      const angleIdxForStep = (req.angle_index ?? 1) - 1;
      const angleForStep = angles[angleIdxForStep] ?? angles[0];
      if (!angleForStep) {
        failed.push({ podcast_id: req.podcast_id, step, reason: 'client_has_no_angles' });
        continue;
      }

      // ── Step 2: host-based follow-up ─────────────────────────────
      if (step === 'step2') {
        if (!req.parent_pitch_id) {
          failed.push({
            podcast_id: req.podcast_id,
            step,
            reason: 'step2_requires_parent_pitch_id (from get_step2_eligible_hosts)',
          });
          continue;
        }
        if (!req.client_story_anchor || !req.host_excerpt) {
          failed.push({
            podcast_id: req.podcast_id,
            step,
            reason: 'step2_requires_client_story_anchor_and_host_excerpt (run match_client_story_to_host first)',
          });
          continue;
        }

        const hostCtx = await db.query.hostPersonalContexts.findFirst({
          where: eq(hostPersonalContexts.podcastId, req.podcast_id),
        });
        if (!hostCtx || !hostCtx.hasSufficientContext) {
          failed.push({
            podcast_id: req.podcast_id,
            step,
            reason: 'no_sufficient_host_context (a VA must add host material first)',
          });
          continue;
        }

        const hostSource = {
          sourceType: req.host_source_type ?? ('article' as HostSourceType),
          url: req.host_source_url,
          excerpt: req.host_excerpt,
          matchedClientStoryAnchor: req.client_story_anchor,
        };

        const [step2Row] = await db
          .insert(pitches)
          .values({
            clientProfileId: ctx.clientProfileId,
            podcastId: req.podcast_id,
            composedBy: ctx.userId,
            status: 'draft',
            step: 'step2',
            parentPitchId: req.parent_pitch_id,
            angleUsed: angleIdxForStep + 1,
            hostContextSource: hostSource,
            aiAssisted: true,
          })
          .returning({ id: pitches.id });

        try {
          const genInput: GenerationInput = {
            pitchId: step2Row.id,
            step: 'step2',
            clientName: client.company ? client.company : 'the founder',
            clientTitle: 'Founder',
            clientCompany: client.company ?? '',
            clientBio: client.longBio ?? client.oneLineBio ?? '',
            clientAngle: { title: angleForStep.title, description: angleForStep.description },
            clientAudience: client.targetAudience ?? '',
            podcastName: podcast.title,
            podcastHost: hostCtx.hostName ?? podcast.hostName ?? 'the host',
            podcastDescription: podcast.description ?? '',
            hostPersonalContext: {
              sourceType: hostSource.sourceType,
              url: hostSource.url,
              excerpt: hostSource.excerpt,
              matchedClientStoryAnchor: hostSource.matchedClientStoryAnchor,
            },
            tone: req.tone ?? 'professional',
            length: req.length ?? 'medium',
          };

          const out = await generatePitch(genInput);

          await db
            .update(pitches)
            .set({ subject: out.subject, body: out.body, updatedAt: new Date() })
            .where(eq(pitches.id, step2Row.id));

          producedThisCall++;
          generated.push({
            pitch_id: step2Row.id,
            podcast_id: req.podcast_id,
            step: 'step2',
            parent_pitch_id: req.parent_pitch_id,
            subject: out.subject,
            body: out.body,
            angle_used: angleIdxForStep + 1,
            framework_used: out.frameworksUsed,
            word_count: out.body.trim().split(/\s+/).length,
          });
        } catch (err) {
          await db.delete(pitches).where(eq(pitches.id, step2Row.id));
          failed.push({
            podcast_id: req.podcast_id,
            step,
            reason: err instanceof Error ? err.message : 'generation_failed',
          });
        }
        continue;
      }

      // ── Step 1: episode-based first touch ────────────────────────
      const episodes = podcast.recentEpisodes ?? [];
      const epIndex = req.episode_to_reference ?? 0;
      const episode = episodes[epIndex];
      if (!episode) {
        failed.push({ podcast_id: req.podcast_id, step, reason: 'no_episode_to_reference' });
        continue;
      }

      const angleIdx = angleIdxForStep;
      const angle = angleForStep;

      // Create the draft pitch row first — generatePitch logs ai_generations by pitchId.
      const [pitchRow] = await db
        .insert(pitches)
        .values({
          clientProfileId: ctx.clientProfileId,
          podcastId: req.podcast_id,
          composedBy: ctx.userId,
          status: 'draft',
          step: 'step1',
          angleUsed: angleIdx + 1,
          aiAssisted: true,
        })
        .returning({ id: pitches.id });

      try {
        const genInput: GenerationInput = {
          pitchId: pitchRow.id,
          step: 'step1',
          clientName: client.company ? client.company : 'the founder',
          clientTitle: 'Founder',
          clientCompany: client.company ?? '',
          clientBio: client.longBio ?? client.oneLineBio ?? '',
          clientAngle: { title: angle.title, description: angle.description },
          clientAudience: client.targetAudience ?? '',
          podcastName: podcast.title,
          podcastHost: podcast.hostName ?? 'the host',
          podcastDescription: podcast.description ?? '',
          episode: {
            title: episode.title,
            pubDate: episode.pubDate,
            summary: episode.description ?? '',
          },
          tone: req.tone ?? 'professional',
          length: req.length ?? 'medium',
        };

        const out = await generatePitch(genInput);

        await db
          .update(pitches)
          .set({
            subject: out.subject,
            body: out.body,
            episodeReferenced: {
              title: episode.title,
              pubDate: episode.pubDate,
              summary: episode.description ?? '',
            },
            updatedAt: new Date(),
          })
          .where(eq(pitches.id, pitchRow.id));

        producedThisCall++;
        generated.push({
          pitch_id: pitchRow.id,
          podcast_id: req.podcast_id,
          step: 'step1',
          subject: out.subject,
          body: out.body,
          angle_used: angleIdx + 1,
          framework_used: out.frameworksUsed,
          word_count: out.body.trim().split(/\s+/).length,
        });
      } catch (err) {
        // Roll back the empty draft so failures don't litter the review queue.
        await db.delete(pitches).where(eq(pitches.id, pitchRow.id));
        failed.push({
          podcast_id: req.podcast_id,
          step,
          reason: err instanceof Error ? err.message : 'generation_failed',
        });
      }
    }

    return {
      generated,
      failed,
      quota_check: {
        requested: requests.length,
        quota_available: Number.isFinite(remaining) ? remaining : null,
        actually_generated: producedThisCall,
        drafts_pending_review: pendingForClient + producedThisCall,
      },
      review_url: `/va/clients/${ctx.clientProfileId}/review`,
    };
  },
};
