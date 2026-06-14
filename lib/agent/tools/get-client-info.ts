import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { clientProfiles, users } from '@/db/schema';
import type { ToolDefinition } from '@/lib/agent/types';

/**
 * Tool 1 — get_client_info
 * Returns the active client's full intake + state, including v3 ICP fields. For
 * ANY client-specific task the agent must call this first (system prompt enforces).
 */
export const getClientInfo: ToolDefinition = {
  name: 'get_client_info',
  description:
    "Get the active client's full profile: bio, company, angles, topics, target audience, goals, ICP qualifiers (revenue range, years in business, prior podcast experience), sending-domain warmup status, and whether their sending inbox is connected. Call this FIRST for any client-specific task.",
  inputSchema: { type: 'object', properties: {} },
  async execute(_input, ctx) {
    const rows = await db
      .select({
        id: clientProfiles.id,
        fullName: users.fullName,
        email: users.email,
        company: clientProfiles.company,
        website: clientProfiles.website,
        oneLineBio: clientProfiles.oneLineBio,
        longBio: clientProfiles.longBio,
        topics: clientProfiles.topics,
        angles: clientProfiles.angles,
        targetAudience: clientProfiles.targetAudience,
        goals: clientProfiles.goals,
        sampleQuestions: clientProfiles.sampleQuestions,
        avoidTopics: clientProfiles.avoidTopics,
        revenueRange: clientProfiles.revenueRange,
        yearsInBusiness: clientProfiles.yearsInBusiness,
        hasBeenOnPodcast: clientProfiles.hasBeenOnPodcast,
        newSendingDomain: clientProfiles.newSendingDomain,
        unipileAccountId: clientProfiles.unipileAccountId,
        status: clientProfiles.status,
        intakeCompletedAt: clientProfiles.intakeCompletedAt,
        bookingLink: clientProfiles.bookingLink,
        slug: clientProfiles.slug,
      })
      .from(clientProfiles)
      .leftJoin(users, eq(clientProfiles.userId, users.id))
      .where(eq(clientProfiles.id, ctx.clientProfileId))
      .limit(1);

    const c = rows[0];
    if (!c) return { error: 'Client profile not found.' };

    return {
      client_profile_id: c.id,
      full_name: c.fullName,
      email: c.email,
      company: c.company,
      website: c.website,
      one_line_bio: c.oneLineBio,
      long_bio: c.longBio,
      topics: c.topics ?? [],
      angles: (c.angles ?? []).map((a, i) => ({ index: i + 1, ...a })),
      target_audience: c.targetAudience,
      goals: c.goals,
      sample_questions: c.sampleQuestions ?? [],
      avoid_topics: c.avoidTopics,
      revenue_range: c.revenueRange,
      years_in_business: c.yearsInBusiness,
      has_been_on_podcast: c.hasBeenOnPodcast,
      new_sending_domain: c.newSendingDomain,
      sending_inbox_connected: Boolean(c.unipileAccountId),
      status: c.status,
      intake_completed: Boolean(c.intakeCompletedAt),
      booking_link: c.bookingLink,
      media_page_slug: c.slug,
    };
  },
};
