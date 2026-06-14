/**
 * PodPick — Drizzle schema v3
 *
 * 19 tables total: 14 from v2 + 5 new for v3.
 *
 * New in v3:
 *  - onboarding_email_sends (audit trail of 9-email trial sequence)
 *  - host_personal_contexts (Step 2 pitch personalization data)
 *  - send_schedules (per-period planned send calendar)
 *  - positive_reply_lifecycle (Hot Leads pipeline)
 *  - monthly_recaps (end-of-period client summaries)
 *
 * Updated in v3:
 *  - ai_frameworks: added `step` enum
 *  - pitches: added `step`, `parent_pitch_id`, `send_scheduled_for`
 *  - client_profiles: added ICP qualification fields + new_sending_domain flag
 *  - subscriptions: added concentrated_push flag for book launches etc.
 */

import {
  pgTable, uuid, text, integer, boolean, timestamp, jsonb, pgEnum,
  index, uniqueIndex,
} from 'drizzle-orm/pg-core';

// ───────────────────────────────────────────────────────────────
// ENUMS
// ───────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum('user_role', ['admin', 'va', 'client']);
export const tierEnum = pgEnum('tier', ['standard', 'pro']);
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'trialing', 'active', 'past_due', 'paused', 'canceled',
]);
export const clientStatusEnum = pgEnum('client_status', [
  'trialing', 'active', 'paused', 'canceled',
]);
export const pitchStatusEnum = pgEnum('pitch_status', [
  'draft', 'queued', 'scheduled', 'sent', 'failed', 'bounced', 'replied',
]);
export const pitchStepEnum = pgEnum('pitch_step', ['step1', 'step2']);
export const sendEventTypeEnum = pgEnum('send_event_type', [
  'queued', 'scheduled', 'sent', 'delivered', 'opened', 'bounced', 'replied', 'failed',
]);
export const responseClassificationEnum = pgEnum('response_classification', [
  'positive', 'soft_no', 'hard_no', 'auto_reply', 'question', 'booking_inquiry', 'other',
]);
export const suggestionStatusEnum = pgEnum('suggestion_status', [
  'suggested', 'queued', 'pitched', 'skipped',
]);
export const senderRoleEnum = pgEnum('sender_role', ['client', 'va', 'admin']);
export const toneEnum = pgEnum('tone', ['professional', 'casual', 'sharp']);
export const frameworkStepEnum = pgEnum('framework_step', ['step1', 'step2', 'either']);
export const onboardingEmailTemplateEnum = pgEnum('onboarding_email_template', [
  'welcome', 'intake_nudge', 'intake_reminder', 'researching',
  'first_pitches_sent', 'mid_trial_checkin', 'trial_converting_tomorrow',
  'welcome_paid', 'trial_ended_canceled', 'first_month_milestone',
  'winback_30', 'winback_60', 'winback_90',
]);
export const positiveLifecycleStageEnum = pgEnum('positive_lifecycle_stage', [
  'new', 'va_drafted', 'client_notified', 'response_sent',
  'in_conversation', 'booked', 'recorded', 'live', 'dropped',
]);

// ───────────────────────────────────────────────────────────────
// USERS
// ───────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  fullName: text('full_name'),
  role: userRoleEnum('role').notNull(),
  avatarUrl: text('avatar_url'),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ───────────────────────────────────────────────────────────────
// CLIENT_PROFILES — extended with ICP qualification + warmup
// ───────────────────────────────────────────────────────────────

export const clientProfiles = pgTable('client_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),

  // Profile basics
  company: text('company'),
  website: text('website'),
  linkedinUrl: text('linkedin_url'),
  twitterUrl: text('twitter_url'),
  oneLineBio: text('one_line_bio'),
  longBio: text('long_bio'),
  headshotUrl: text('headshot_url'),

  // Intake — angles, audience, story
  topics: text('topics').array(),
  angles: jsonb('angles').$type<Array<{ title: string; description: string }>>(),
  targetAudience: text('target_audience'),
  pastAppearances: jsonb('past_appearances').$type<
    Array<{ podcastName: string; episodeUrl?: string; date?: string }>
  >(),
  goals: text('goals'),
  sampleQuestions: text('sample_questions').array(),
  avoidTopics: text('avoid_topics'),

  // NEW v3 — ICP qualification fields
  revenueRange: text('revenue_range'),       // e.g., '$300K-$500K'
  yearsInBusiness: integer('years_in_business'),
  hasBeenOnPodcast: boolean('has_been_on_podcast').default(false),
  publicArtifactUrl: text('public_artifact_url'),  // tweet thread / blog post / talk

  // NEW v3 — Sending domain status
  newSendingDomain: boolean('new_sending_domain').default(true),  // triggers warmup mode

  // Sending
  unipileAccountId: text('unipile_account_id'),
  sendingAlias: text('sending_alias'),
  replyToEmail: text('reply_to_email'),

  // Booking
  bookingLink: text('booking_link'),

  // Media page
  slug: text('slug').notNull().unique(),
  pressKitUrl: text('press_kit_url'),

  // Assignment
  assignedVaId: uuid('assigned_va_id').references(() => users.id, { onDelete: 'set null' }),

  status: clientStatusEnum('status').notNull().default('trialing'),
  intakeCompletedAt: timestamp('intake_completed_at', { withTimezone: true }),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  slugIdx: uniqueIndex('client_profiles_slug_idx').on(t.slug),
  statusIdx: index('client_profiles_status_idx').on(t.status),
  assignedIdx: index('client_profiles_assigned_idx').on(t.assignedVaId),
}));

// ───────────────────────────────────────────────────────────────
// SUBSCRIPTIONS — with concentrated_push flag for v3
// ───────────────────────────────────────────────────────────────

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientProfileId: uuid('client_profile_id').notNull()
    .references(() => clientProfiles.id, { onDelete: 'cascade' }),

  stripeCustomerId: text('stripe_customer_id').notNull(),
  stripeSubscriptionId: text('stripe_subscription_id').notNull().unique(),
  stripePriceId: text('stripe_price_id').notNull(),

  tier: tierEnum('tier').notNull(),
  status: subscriptionStatusEnum('status').notNull().default('trialing'),

  monthlyPitchQuota: integer('monthly_pitch_quota').notNull(),
  pitchesUsedThisPeriod: integer('pitches_used_this_period').notNull().default(0),

  // NEW v3 — book launch / funding announcement concentrated push mode
  concentratedPush: boolean('concentrated_push').default(false),

  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  canceledAt: timestamp('canceled_at', { withTimezone: true }),

  // Client scheduled a cancellation that takes effect at period end. Service
  // continues until currentPeriodEnd; Stripe flips status to canceled then.
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  clientIdx: index('subscriptions_client_idx').on(t.clientProfileId),
  statusIdx: index('subscriptions_status_idx').on(t.status),
}));

// ───────────────────────────────────────────────────────────────
// PODCASTS
// ───────────────────────────────────────────────────────────────

export const podcasts = pgTable('podcasts', {
  id: uuid('id').primaryKey().defaultRandom(),
  rephonicId: text('rephonic_id').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  hostName: text('host_name'),
  hostEmails: text('host_emails').array(),
  category: text('category').array(),
  country: text('country'),
  language: text('language'),
  audienceDemographics: jsonb('audience_demographics').$type<{
    genderSplit?: { male: number; female: number; nonBinary: number };
    ageRange?: { min: number; max: number; primary: string };
    countryBreakdown?: Record<string, number>;
  }>(),
  audienceSizeEstimate: integer('audience_size_estimate'),
  recentEpisodes: jsonb('recent_episodes').$type<
    Array<{ title: string; pubDate: string; description: string; audioUrl?: string }>
  >(),
  rssUrl: text('rss_url'),
  websiteUrl: text('website_url'),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  titleIdx: index('podcasts_title_idx').on(t.title),
  categoryIdx: index('podcasts_category_idx').on(t.category),
}));

// ───────────────────────────────────────────────────────────────
// PODCAST_SUGGESTIONS
// ───────────────────────────────────────────────────────────────

export const podcastSuggestions = pgTable('podcast_suggestions', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientProfileId: uuid('client_profile_id').notNull()
    .references(() => clientProfiles.id, { onDelete: 'cascade' }),
  podcastId: uuid('podcast_id').notNull().references(() => podcasts.id, { onDelete: 'cascade' }),
  rank: integer('rank').notNull(),
  reason: text('reason'),
  status: suggestionStatusEnum('status').notNull().default('suggested'),
  generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  clientIdx: index('podcast_suggestions_client_idx').on(t.clientProfileId),
  statusIdx: index('podcast_suggestions_status_idx').on(t.status),
  uniqClientPodcast: uniqueIndex('podcast_suggestions_uniq').on(t.clientProfileId, t.podcastId),
}));

// ───────────────────────────────────────────────────────────────
// PITCHES — with step, parent_pitch_id, send_scheduled_for (v3 additions)
// ───────────────────────────────────────────────────────────────

export const pitches = pgTable('pitches', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientProfileId: uuid('client_profile_id').notNull()
    .references(() => clientProfiles.id, { onDelete: 'cascade' }),
  podcastId: uuid('podcast_id').notNull().references(() => podcasts.id, { onDelete: 'restrict' }),
  composedBy: uuid('composed_by').references(() => users.id, { onDelete: 'set null' }),

  status: pitchStatusEnum('status').notNull().default('draft'),

  // NEW v3 — step awareness
  step: pitchStepEnum('step').notNull().default('step1'),
  parentPitchId: uuid('parent_pitch_id'),  // For Step 2 retries — references original Step 1
  sendScheduledFor: timestamp('send_scheduled_for', { withTimezone: true }),  // Send pipeline sets this

  subject: text('subject'),
  body: text('body'),
  episodeReferenced: jsonb('episode_referenced').$type<{
    title: string; pubDate: string; summary: string;
  }>(),

  // NEW v3 — Step 2 personalization source
  hostContextSource: jsonb('host_context_source').$type<{
    sourceType: 'linkedin_post' | 'substack' | 'interview' | 'article' | 'journey';
    url?: string;
    excerpt: string;
    matchedClientStoryAnchor: string;
  }>(),

  angleUsed: integer('angle_used'),
  aiAssisted: boolean('ai_assisted').notNull().default(false),

  sentAt: timestamp('sent_at', { withTimezone: true }),
  messageId: text('message_id'),
  threadId: text('thread_id'),

  draftHistory: jsonb('draft_history').$type<
    Array<{ version: number; subject: string; body: string; editedAt: string; editedBy: string }>
  >().default([]),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  clientIdx: index('pitches_client_idx').on(t.clientProfileId),
  statusIdx: index('pitches_status_idx').on(t.status),
  stepIdx: index('pitches_step_idx').on(t.step),
  messageIdIdx: index('pitches_message_id_idx').on(t.messageId),
  scheduledIdx: index('pitches_scheduled_idx').on(t.sendScheduledFor),
}));

// ───────────────────────────────────────────────────────────────
// SEND_EVENTS
// ───────────────────────────────────────────────────────────────

export const sendEvents = pgTable('send_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  pitchId: uuid('pitch_id').notNull().references(() => pitches.id, { onDelete: 'cascade' }),
  eventType: sendEventTypeEnum('event_type').notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pitchIdx: index('send_events_pitch_idx').on(t.pitchId),
  typeIdx: index('send_events_type_idx').on(t.eventType),
}));

// ───────────────────────────────────────────────────────────────
// RESPONSES
// ───────────────────────────────────────────────────────────────

export const responses = pgTable('responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  pitchId: uuid('pitch_id').notNull().references(() => pitches.id, { onDelete: 'cascade' }),
  fromEmail: text('from_email').notNull(),
  subject: text('subject'),
  body: text('body'),
  classification: responseClassificationEnum('classification'),
  forwardedToClientAt: timestamp('forwarded_to_client_at', { withTimezone: true }),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pitchIdx: index('responses_pitch_idx').on(t.pitchId),
  classificationIdx: index('responses_classification_idx').on(t.classification),
}));

// ───────────────────────────────────────────────────────────────
// MEDIA_PAGES
// ───────────────────────────────────────────────────────────────

export const mediaPages = pgTable('media_pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientProfileId: uuid('client_profile_id').notNull().unique()
    .references(() => clientProfiles.id, { onDelete: 'cascade' }),
  isPublished: boolean('is_published').notNull().default(false),
  heroImageUrl: text('hero_image_url'),
  ogImageUrl: text('og_image_url'),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  customStyles: jsonb('custom_styles').$type<Record<string, string>>(),
  customSections: jsonb('custom_sections').$type<
    Array<{ id: string; type: string; title: string; content: string }>
  >(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ───────────────────────────────────────────────────────────────
// CONVERSATIONS + MESSAGES — async client↔VA chat
// ───────────────────────────────────────────────────────────────

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientProfileId: uuid('client_profile_id').notNull()
    .references(() => clientProfiles.id, { onDelete: 'cascade' }),
  vaId: uuid('va_id').references(() => users.id, { onDelete: 'set null' }),
  unreadCountClient: integer('unread_count_client').notNull().default(0),
  unreadCountVa: integer('unread_count_va').notNull().default(0),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  clientIdx: index('conversations_client_idx').on(t.clientProfileId),
  vaIdx: index('conversations_va_idx').on(t.vaId),
}));

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  senderRole: senderRoleEnum('sender_role').notNull(),
  body: text('body').notNull(),
  attachments: jsonb('attachments').$type<
    Array<{ url: string; filename: string; sizeBytes: number }>
  >(),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  conversationIdx: index('messages_conversation_idx').on(t.conversationId),
  createdAtIdx: index('messages_created_at_idx').on(t.createdAt),
}));

// ───────────────────────────────────────────────────────────────
// AI TRAINING — prompts, frameworks, docs, generation logs
// ───────────────────────────────────────────────────────────────

export const aiPrompts = pgTable('ai_prompts', {
  id: uuid('id').primaryKey().defaultRandom(),
  version: integer('version').notNull().unique(),
  step: pitchStepEnum('step').notNull().default('step1'),  // NEW v3: prompts are step-specific
  promptText: text('prompt_text').notNull(),
  changeNote: text('change_note'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  isCurrent: boolean('is_current').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  currentIdx: index('ai_prompts_current_idx').on(t.isCurrent, t.step),
}));

export const aiFrameworks = pgTable('ai_frameworks', {
  id: uuid('id').primaryKey().defaultRandom(),
  label: text('label').notNull(),
  body: text('body').notNull(),
  step: frameworkStepEnum('step').notNull().default('either'),  // NEW v3: step-specific frameworks
  tone: toneEnum('tone').notNull().default('professional'),
  useCases: text('use_cases').array(),
  weight: integer('weight').notNull().default(1),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  activeIdx: index('ai_frameworks_active_idx').on(t.isActive, t.step),
}));

export const aiTrainingDocs = pgTable('ai_training_docs', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  fileUrl: text('file_url').notNull(),
  parsedText: text('parsed_text'),
  chunks: jsonb('chunks').$type<Array<{ text: string; tags?: string[] }>>().default([]),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const aiGenerations = pgTable('ai_generations', {
  id: uuid('id').primaryKey().defaultRandom(),
  pitchId: uuid('pitch_id').references(() => pitches.id, { onDelete: 'cascade' }),
  promptVersion: integer('prompt_version').notNull(),
  step: pitchStepEnum('step').notNull(),  // NEW v3
  frameworksUsed: text('frameworks_used').array(),
  docsUsed: uuid('docs_used').array(),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  costCents: integer('cost_cents'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  pitchIdx: index('ai_generations_pitch_idx').on(t.pitchId),
}));

// ───────────────────────────────────────────────────────────────
// AUDIT_LOG
// ───────────────────────────────────────────────────────────────

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),
  ipAddress: text('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  entityIdx: index('audit_log_entity_idx').on(t.entityType, t.entityId),
  actorIdx: index('audit_log_actor_idx').on(t.actorId),
}));

// ═══════════════════════════════════════════════════════════════
// NEW v3 TABLES BELOW
// ═══════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────
// ONBOARDING_EMAIL_SENDS — audit + idempotency for the 9-email trial flow
// ───────────────────────────────────────────────────────────────

export const onboardingEmailSends = pgTable('onboarding_email_sends', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientProfileId: uuid('client_profile_id').notNull()
    .references(() => clientProfiles.id, { onDelete: 'cascade' }),
  template: onboardingEmailTemplateEnum('template').notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
  resendMessageId: text('resend_message_id'),
  metadata: jsonb('metadata').$type<{
    subject?: string;
    variableSnapshot?: Record<string, string>;
    triggerContext?: string;
  }>(),
}, (t) => ({
  clientIdx: index('onboarding_email_sends_client_idx').on(t.clientProfileId),
  // Idempotency — a given template fires at most once per client
  uniqClientTemplate: uniqueIndex('onboarding_email_sends_uniq').on(t.clientProfileId, t.template),
}));

// ───────────────────────────────────────────────────────────────
// HOST_PERSONAL_CONTEXTS — Step 2 personalization data per host
// ───────────────────────────────────────────────────────────────

export const hostPersonalContexts = pgTable('host_personal_contexts', {
  id: uuid('id').primaryKey().defaultRandom(),
  podcastId: uuid('podcast_id').notNull().unique()
    .references(() => podcasts.id, { onDelete: 'cascade' }),
  hostName: text('host_name'),

  // Raw context — populated by VA or scraping job, used by Step 2 prompt
  linkedinSummary: text('linkedin_summary'),
  linkedinUrl: text('linkedin_url'),
  substackUrl: text('substack_url'),

  recentPosts: jsonb('recent_posts').$type<
    Array<{
      source: 'linkedin' | 'substack' | 'twitter' | 'medium' | 'other';
      title: string;
      body: string;
      url: string;
      date: string;
    }>
  >().default([]),

  interviewQuotes: jsonb('interview_quotes').$type<
    Array<{ source: string; quote: string; url?: string; context?: string }>
  >().default([]),

  personalJourney: text('personal_journey'),  // VA-summarized arc

  // Coverage flag — set to true when there's enough material for Step 2 pitches
  hasSufficientContext: boolean('has_sufficient_context').notNull().default(false),

  lastRefreshedAt: timestamp('last_refreshed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  sufficientIdx: index('host_personal_contexts_sufficient_idx').on(t.hasSufficientContext),
}));

// ───────────────────────────────────────────────────────────────
// SEND_SCHEDULES — per-client per-period planned send calendar
// ───────────────────────────────────────────────────────────────

export const sendSchedules = pgTable('send_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientProfileId: uuid('client_profile_id').notNull()
    .references(() => clientProfiles.id, { onDelete: 'cascade' }),

  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),

  // Planned cadence — array of slots that the pipeline fills with actual pitches
  plannedSends: jsonb('planned_sends').$type<
    Array<{
      scheduledFor: string;          // ISO
      slotType: 'step1' | 'step2' | 'followup';
      weekNumber: 1 | 2 | 3 | 4;
      pitchId?: string;              // populated when a pitch is assigned
      sentAt?: string;
    }>
  >().notNull().default([]),

  // Mode flags
  warmupMode: boolean('warmup_mode').notNull().default(false),     // Reduced cadence for new domains
  manualOverride: boolean('manual_override').notNull().default(false),  // VA disabled auto-scheduling
  concentratedPush: boolean('concentrated_push').notNull().default(false),  // Book/funding launch mode

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  clientIdx: index('send_schedules_client_idx').on(t.clientProfileId),
  periodIdx: index('send_schedules_period_idx').on(t.periodStart, t.periodEnd),
  uniqClientPeriod: uniqueIndex('send_schedules_uniq').on(t.clientProfileId, t.periodStart),
}));

// ───────────────────────────────────────────────────────────────
// POSITIVE_REPLY_LIFECYCLE — Hot Leads pipeline
// ───────────────────────────────────────────────────────────────

export const positiveReplyLifecycle = pgTable('positive_reply_lifecycle', {
  id: uuid('id').primaryKey().defaultRandom(),
  responseId: uuid('response_id').notNull().unique()
    .references(() => responses.id, { onDelete: 'cascade' }),
  pitchId: uuid('pitch_id').notNull().references(() => pitches.id, { onDelete: 'cascade' }),
  clientProfileId: uuid('client_profile_id').notNull()
    .references(() => clientProfiles.id, { onDelete: 'cascade' }),

  stage: positiveLifecycleStageEnum('stage').notNull().default('new'),

  // VA-drafted response email for client to review and send
  vaDraftResponse: text('va_draft_response'),
  vaDraftedAt: timestamp('va_drafted_at', { withTimezone: true }),
  vaDraftedBy: uuid('va_drafted_by').references(() => users.id, { onDelete: 'set null' }),

  clientNotifiedAt: timestamp('client_notified_at', { withTimezone: true }),
  clientSentAt: timestamp('client_sent_at', { withTimezone: true }),

  // Booking outcome
  bookedFor: timestamp('booked_for', { withTimezone: true }),
  recordedAt: timestamp('recorded_at', { withTimezone: true }),
  episodeUrl: text('episode_url'),

  // Drop tracking for stale leads
  daysSinceLastActivity: integer('days_since_last_activity').default(0),
  lastActivityAt: timestamp('last_activity_at', { withTimezone: true }).notNull().defaultNow(),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  clientIdx: index('positive_reply_lifecycle_client_idx').on(t.clientProfileId),
  stageIdx: index('positive_reply_lifecycle_stage_idx').on(t.stage),
  staleIdx: index('positive_reply_lifecycle_stale_idx').on(t.daysSinceLastActivity),
}));

// ───────────────────────────────────────────────────────────────
// MONTHLY_RECAPS — end-of-period summaries sent to clients
// ───────────────────────────────────────────────────────────────

export const monthlyRecaps = pgTable('monthly_recaps', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientProfileId: uuid('client_profile_id').notNull()
    .references(() => clientProfiles.id, { onDelete: 'cascade' }),

  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),

  // Numbers
  pitchesSent: integer('pitches_sent').notNull().default(0),
  pitchesStep1: integer('pitches_step1').notNull().default(0),
  pitchesStep2: integer('pitches_step2').notNull().default(0),
  repliesReceived: integer('replies_received').notNull().default(0),
  positiveReplies: integer('positive_replies').notNull().default(0),
  bookings: integer('bookings').notNull().default(0),

  // VA's observation — qualitative
  observations: text('observations'),

  // Sent as both a dashboard message and an email
  sentAt: timestamp('sent_at', { withTimezone: true }),
  sentBy: uuid('sent_by').references(() => users.id, { onDelete: 'set null' }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  clientIdx: index('monthly_recaps_client_idx').on(t.clientProfileId),
  periodIdx: index('monthly_recaps_period_idx').on(t.periodStart, t.periodEnd),
  uniqClientPeriod: uniqueIndex('monthly_recaps_uniq').on(t.clientProfileId, t.periodStart),
}));

// ───────────────────────────────────────────────────────────────
// TYPE EXPORTS
// ───────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ClientProfile = typeof clientProfiles.$inferSelect;
export type NewClientProfile = typeof clientProfiles.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type Podcast = typeof podcasts.$inferSelect;
export type PodcastSuggestion = typeof podcastSuggestions.$inferSelect;
export type Pitch = typeof pitches.$inferSelect;
export type NewPitch = typeof pitches.$inferInsert;
export type SendEvent = typeof sendEvents.$inferSelect;
export type Response = typeof responses.$inferSelect;
export type MediaPage = typeof mediaPages.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type AiPrompt = typeof aiPrompts.$inferSelect;
export type AiFramework = typeof aiFrameworks.$inferSelect;
export type AiTrainingDoc = typeof aiTrainingDocs.$inferSelect;
export type AiGeneration = typeof aiGenerations.$inferSelect;
export type AuditLogEntry = typeof auditLog.$inferSelect;

// v3 additions
export type OnboardingEmailSend = typeof onboardingEmailSends.$inferSelect;
export type HostPersonalContext = typeof hostPersonalContexts.$inferSelect;
export type SendSchedule = typeof sendSchedules.$inferSelect;
export type PositiveReplyLifecycle = typeof positiveReplyLifecycle.$inferSelect;
export type MonthlyRecap = typeof monthlyRecaps.$inferSelect;
