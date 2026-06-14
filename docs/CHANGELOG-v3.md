# PodPick v3 — CHANGELOG

**Release:** v3.0.0
**Compared to:** v2 (see `docs/build-plan-v2.md`)
**Migration effort:** Additive on v2. No breaking changes to existing functionality.

---

## Summary

v3 takes the agent-driven foundation from v2 and adds the operational systems needed to run real clients: automated onboarding emails, send-strategy enforcement, the two-step pitch system, positive-reply lifecycle, and ICP-driven product defaults.

**Headline numbers:**
- 14 → 19 tables (+5)
- 11 → 16 agent tools (+5)
- 8 → 10 week MVP timeline (+2 weeks)
- 1 → 2 pitch generation paths (Step 1 + Step 2)
- 0 → 12 automated emails (9 onboarding + 3 winback)

---

## Schema changes

### New tables (5)

```typescript
// 1. Onboarding email audit + idempotency
onboarding_email_sends {
  id, client_profile_id, template, sent_at, resend_message_id, metadata
}

// 2. Step 2 personalization data per host
host_personal_contexts {
  id, podcast_id, host_name, linkedin_summary, linkedin_url, substack_url,
  recent_posts, interview_quotes, personal_journey, has_sufficient_context,
  last_refreshed_at
}

// 3. Per-client per-period planned send calendar
send_schedules {
  id, client_profile_id, period_start, period_end, planned_sends,
  warmup_mode, manual_override, concentrated_push
}

// 4. Positive reply pipeline (Hot Leads)
positive_reply_lifecycle {
  id, response_id, pitch_id, client_profile_id, stage,
  va_draft_response, va_drafted_at, va_drafted_by,
  client_notified_at, client_sent_at,
  booked_for, recorded_at, episode_url,
  days_since_last_activity, last_activity_at
}

// 5. End-of-period summaries
monthly_recaps {
  id, client_profile_id, period_start, period_end,
  pitches_sent, pitches_step1, pitches_step2,
  replies_received, positive_replies, bookings,
  observations, sent_at, sent_by
}
```

### Column additions

**`client_profiles`** (ICP qualification + warmup):
- `revenue_range` text
- `years_in_business` integer
- `has_been_on_podcast` boolean
- `public_artifact_url` text
- `new_sending_domain` boolean (default true)

**`subscriptions`**:
- `concentrated_push` boolean (for book launch / funding announcement modes)

**`pitches`** (step support):
- `step` enum('step1', 'step2')
- `parent_pitch_id` uuid nullable (for Step 2 retries)
- `send_scheduled_for` timestamp (set by send pipeline)
- `host_context_source` jsonb (Step 2 personalization source)

**`ai_prompts`**:
- `step` enum('step1', 'step2') — prompts are now step-specific

**`ai_frameworks`**:
- `step` enum('step1', 'step2', 'either') — frameworks tagged by step

**`ai_generations`**:
- `step` enum('step1', 'step2') — track step in generation logs

### New enums

- `pitch_step` (step1, step2)
- `framework_step` (step1, step2, either)
- `onboarding_email_template` (welcome, intake_nudge, ..., winback_90 — 13 values)
- `positive_lifecycle_stage` (new, va_drafted, client_notified, ..., dropped — 9 values)

---

## Code additions

### New library modules

**`lib/resend.ts`** — Resend wrapper with idempotent onboarding email sending. Implements all 9 trial emails + 3 winback emails with shared template builder. Idempotency via unique constraint on (client, template).

**`lib/unipile.ts`** — Unipile wrapper (was a stub in v2, now fully implemented). Methods: `sendEmail`, `createOAuthLink`, `getAccountStatus`, `listRecentMessages`.

**`lib/pdf.ts`** — Puppeteer wrapper for one-pager PDF generation. Renders `/m/[slug]/print` to PDF. Used by positive-reply flow when host requests the one-pager.

**`lib/prompts/base-prompt-v2-step1.ts`** — Step 1 (episode-based) seed prompt.

**`lib/prompts/base-prompt-v2-step2.ts`** — Step 2 (host-based) seed prompt.

**`lib/prompts/framework-examples-saas.ts`** — 9 SaaS-founder-flavored framework seeds with step tags and weights.

### New Inngest functions

**`inngest/client.ts`** — Inngest client + typed `AppEvents` vocabulary.

**`inngest/functions/onboarding-emails.ts`** — 9 functions orchestrating the trial email sequence:
- `onSignup` — welcome + intake nudges + schedules day 5/6 checks
- `onIntakeCompleted` — researching email
- `onFirstPitchesSent` — first-pitches-sent email
- `onTrialDay5` — mid-trial check-in
- `onTrialDay6` — converting-tomorrow heads-up
- `onSubscriptionRenewed` — welcome-paid + schedules first-month milestone
- `onSubscriptionCanceled` — trial-ended + schedules 30/60/90 winbacks
- `onFirstMonthComplete` — milestone email
- `onWinbackDue` — winback_30/60/90

**`inngest/functions/send-pitches.ts`** — Send pipeline:
- `schedulePitchSend` — computes next eligible Tue/Wed/Thu slot
- `sendPitch` — actual send with jitter, quota recheck, Unipile call, status update

**`inngest/functions/send-pitch-followup.ts`** — Step 1 + Step 2 follow-up sends 4-5 days after original, in-thread reply, skips if reply already received.

**`inngest/functions/weekly-pitch-plan.ts`** — Monday 6am UTC cron + per-client planning:
- Computes week of period
- Applies Standard 3-3-2-2 / Pro 7-7-6-5 cadence (or warmup variants)
- Determines Step 1/2 split (100% Step 1 in month 1, 70/30 in month 2+)
- Upserts `send_schedules` row

**`inngest/functions/monthly-recap.ts`** — Period rollover handler:
- Aggregates pitches/replies/positives/bookings
- Inserts `monthly_recaps` row in draft state
- Notifies VA in their conversation thread to add observation before sending

### Updated modules

**`lib/anthropic.ts`** — Step-aware:
- `step` parameter required on `GenerationInput`
- Loads step-specific base prompt (filtered by `ai_prompts.step`)
- Pulls frameworks where `step IN (matching_step, 'either')`
- Validates Step 1 max 90 words / Step 2 max 110 words
- Step 2 requires `hostPersonalContext` input or throws
- Logs step in `ai_generations`

**`lib/stripe.ts`** — Light updates:
- Fires `client.signup` Inngest event after checkout completes
- Fires `client.subscription_renewed` on trial-to-active transition
- Fires `client.subscription_canceled` on cancellation
- Fires `client.period_rollover` on invoice.paid (period reset)

**`middleware.ts`** — Adds bypass for `/api/inngest` route (Inngest webhooks).

### Agent tool catalog

5 new tools added (see `docs/agent-tool-catalog-v3.md`):

- `find_host_personal_context` — locates host LinkedIn/Substack/interview material
- `match_client_story_to_host` — pre-pass picking which client story chapter fits
- `get_step2_eligible_hosts` — silent prospects with sufficient host context
- `get_planned_send_schedule` — current period's planned + actual sends
- `draft_positive_reply` — drafts the suggested response for client review

1 tool updated:

- `generate_pitches` — adds required `step` parameter; Step 2 requires `host_personal_context_id`

---

## Operational doc integration

All operational docs are now in `docs/`:

- `podengine-icp-analysis.md` — primary ICP (bootstrapped SaaS founders) + secondary expansion paths
- `podengine-pitch-templates.md` — 2-step pitch framework with worked examples
- `podengine-onboarding-emails.md` — full content of 9-email sequence
- `podengine-send-strategy.md` — cadence rules + warmup mode
- `podengine-one-pager.md` — positive-reply response flow
- `podengine-va-runbook.md` — VA day-to-day operations
- `podpick-reply-subsequences.md` — cold outreach reply handling for PodEngine's own acquisition

These docs are now the canonical source for behavioral specifications. Code references them; cursor prompts reference them.

---

## Build plan changes

**Phase structure** (was 4 phases / 8 weeks in v2 → 4 phases / 10 weeks in v3):

| Phase | Weeks | What |
|---|---|---|
| 1 | 1-3 | Foundation, auth, intake, media page, app shells |
| 2 | 4-5 | Agent + Step 1 generation + bulk review + send pipeline |
| 3 | 6-7 | Step 2 + host context + positive-reply lifecycle |
| 4 | 8-10 | Onboarding automation, send-strategy polish, admin dashboard, first 5 clients |

**Most consequential additions:**

- Week 2 extended for ICP intake fields (revenue range, years in business, etc.)
- Week 4 agent now step-aware from day 1
- Week 6 entirely new (Step 2 + host_personal_contexts)
- Week 7 entirely new (positive-reply lifecycle + Hot Leads)
- Week 8 onboarding automation built (was hand-waved in v2)
- Week 10 added (admin dashboard polish + soft launch)

---

## Cost model delta

Approximate fixed monthly costs at ~30 paying clients:

| | v2 | v3 | Δ |
|---|---|---|---|
| Inngest | $0 | $25 | +$25 |
| Resend | $20 | $30 | +$10 |
| Anthropic (pitch gen) | $60 | $90 | +$30 |
| Sum of fixed | $630-1340 | $700-1400 | +$70 |

v3 adds ~$70/mo in fixed costs for substantially more capability. Margins per client unchanged (~52% Standard, ~44% Pro).

---

## Migration path from v2

If you have a running v2 deployment and want to migrate to v3:

### Step 1: Schema migration

```bash
# Generate the migration that adds the 5 new tables + 8 new columns
pnpm drizzle-kit generate

# Review the generated SQL in db/migrations/
# Apply to staging first, then production
pnpm drizzle-kit push
```

### Step 2: Seed step-specific prompts

The seed script needs to handle the migration from one prompt (v2) to two prompts (v3 Step 1 + Step 2):

```sql
-- Mark existing prompt as not current
UPDATE ai_prompts SET is_current = false WHERE step IS NULL;

-- Insert step-1 prompt (from base-prompt-v2-step1.ts)
INSERT INTO ai_prompts (version, step, prompt_text, is_current, change_note) VALUES (...);

-- Insert step-2 prompt (from base-prompt-v2-step2.ts)
INSERT INTO ai_prompts (version, step, prompt_text, is_current, change_note) VALUES (...);
```

### Step 3: Tag existing frameworks

```sql
-- Default all v2 frameworks to step='either' so they still work
UPDATE ai_frameworks SET step = 'either' WHERE step IS NULL;
```

### Step 4: Backfill ICP qualification fields

These are nullable, so existing clients won't break. Optional admin tool to prompt them to backfill on next login.

### Step 5: Wire up Inngest

Install Inngest, create event/signing keys, deploy. Existing webhook handlers in `lib/stripe.ts` start emitting events; functions register on deploy.

### Step 6: Wire up Resend

Verify sending domain in Resend dashboard. Set `RESEND_API_KEY` + `RESEND_FROM_EMAIL`. The onboarding sequence will start firing on next signup event.

### Step 7: Soft-relaunch the send pipeline

Move existing scheduled-send logic to Inngest. Disable any v2 cron jobs that were doing this work.

**Estimated migration time:** 2-3 dev days for a small (<20 client) v2 deployment.

---

## What v3 still doesn't do

Same exclusions as v2 (documented in `build-plan-v3.md` section 6):

- AI replying directly to host messages (V1)
- Cross-client analytics for clients (admin-only)
- Affiliate program implementation
- Multi-language support
- SMS / Slack notifications
- Custom prompts per client
- Annual paid-in-full pricing
- Custom pause-and-resume UI (Stripe portal handles)
- Mobile app

---

## What's next after v3 (V1 / year 2 scope)

- AI-assisted positive-reply handling (still under VA review but agent drafts more)
- Expansion ICPs: non-fiction authors (months 6-9), consultants (months 9-12)
- ICP-specific landing pages (`/saas`, `/authors`, `/consultants`)
- Custom prompts per client (for clients on higher tiers)
- Analytics dashboard for clients (compare your reply rate to benchmark)
- Referral / affiliate program
- Annual paid-in-full discount
- White-label for agencies that want to resell

---

## Acknowledgments

v3 incorporates extensive operational work from the ICP analysis, pitch template development, onboarding email writing, send strategy specification, VA runbook, and one-pager flow design — all built in parallel with the v2 → v3 architecture work.

The 2-step pitch system in particular came out of recognizing that single-attempt outreach plateaus at ~10% reply rate, while a thoughtful Step 2 with personal-context personalization can compound that to ~15-22% on the same target list.

The positive-reply lifecycle was added when it became clear that 90% of the work is research/writing/sending but 100% of revenue lives in the 10% that's reply handling. v3 invests heavily in that 10%.
