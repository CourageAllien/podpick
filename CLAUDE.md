# CLAUDE.md — PodPick v3 Project Context

This file is read by Cursor agents on every session. Keep it accurate and concise.

---

## What we're building

**PodPick** (internal app name) powers **PodEngine** (customer-facing brand) — a managed podcast pitching service. Three audiences use the app:

1. **Clients** — pay $99-199/mo, see read-only dashboards
2. **VAs (operators)** — chat with an AI agent to research, write, and queue pitches
3. **Admins** — configure AI training data, view metrics, assign VAs to clients

The product sends pitches **from the client's own Gmail/Outlook** via Unipile OAuth — never from a PodEngine domain.

---

## What's locked (do not relitigate)

- **Pricing:** $15 paid 7-day trial → $99/mo Standard (10 pitches) or $199/mo Pro (25 pitches)
- **Primary ICP:** Bootstrapped SaaS founders, $300K-$2M ARR, US/UK/CA/AU
- **Agent-driven VA workspace:** the agent IS the primary interface for VAs (not traditional forms/CRUD UI)
- **VA approval gate:** all pitches require VA approval before sending — no autonomous sends
- **Send from client domain:** Unipile OAuth, never a PodEngine alias
- **Two-step pitch system:** Step 1 (episode-based) + Step 2 (host-based)
- **Send strategy:** Tue/Wed/Thu only, 9am-2pm host-local, 45-90 sec jitter
- **Cadence:** Standard 3-3-2-2 across 4 weeks of period; Pro 7-7-6-5
- **External-facing copy NEVER mentions "AI"** — positioning is "human VA with smart tools"

---

## v3 additions (vs v2)

- Two-step pitch system implemented (Step 1 + Step 2 with separate prompts)
- 9 onboarding emails + 3 win-back emails automated via Inngest
- Send pipeline enforces Tue/Wed/Thu, jitter, warmup mode
- Positive-reply lifecycle (Hot Leads pipeline → VA drafts → client sends)
- One-pager response flow with PDF generation
- ICP-driven product defaults (revenue range field, Rephonic defaults, SaaS framework seeds)
- 5 new database tables, 16 agent tools (up from 11)

---

## Architecture

### Tech stack

- **Next.js 15** App Router (server components default; client components for chat + bulk review)
- **Supabase** for Postgres + auth (magic link only)
- **Drizzle ORM** for type-safe DB access
- **Tailwind + shadcn/ui** for styling — cream/terracotta palette per design system
- **Stripe Subscriptions** with $15 paid trial pattern
- **Anthropic Claude Sonnet 4.5** for pitch writer + agent (`claude-sonnet-4-5`)
- **Unipile** for OAuth-based email sending from client inbox
- **Rephonic** API for podcast discovery (with 30-day caching)
- **Resend** for transactional + onboarding emails
- **Inngest** for background jobs (onboarding sequences, send pipeline, weekly planning, monthly recaps)
- **Vercel** for hosting; **Sentry** for errors; **PostHog** for product analytics

### Three apps under one Next.js project

- `/(public)` — marketing site at `podengine.com`, plus public media pages at `/m/[slug]`
- `/(client)/app/*` — client dashboard (read-only, Instantly-style)
- `/(va)/va/*` — VA workspace (chat-first interface)
- `/(admin)/admin/*` — admin control room

Routing enforced by `middleware.ts` based on `users.role`.

### Three roles

- `admin` — full access
- `va` — assigned-clients scope only
- `client` — own profile only

---

## Database schema (v3)

19 tables. Key entities:

- **users** — auth-linked, has `role`
- **client_profiles** — per-client profile; NEW v3 fields: `revenue_range`, `years_in_business`, `has_been_on_podcast`, `new_sending_domain`
- **subscriptions** — Stripe-linked, tracks quota; NEW v3 field: `concentrated_push`
- **podcasts** — Rephonic-sourced, cached locally
- **podcast_suggestions** — agent's ranked recommendations per client
- **pitches** — drafted/queued/sent pitches; NEW v3 fields: `step`, `parent_pitch_id`, `send_scheduled_for`, `host_context_source`
- **send_events** — audit trail (queued/sent/delivered/bounced/etc)
- **responses** — replies received, classified by AI
- **media_pages** — public per-client page customization
- **conversations + messages** — async client↔VA chat
- **ai_prompts + ai_frameworks + ai_training_docs + ai_generations** — admin training surface; NEW v3: `step` column on prompts and frameworks
- **audit_log** — destructive action history

**NEW v3 tables:**
- **onboarding_email_sends** — audit + idempotency for the 9-email sequence
- **host_personal_contexts** — Step 2 personalization data per host
- **send_schedules** — per-client per-period planned send calendar
- **positive_reply_lifecycle** — Hot Leads pipeline (new → va_drafted → client_notified → response_sent → booked)
- **monthly_recaps** — end-of-period summary data + VA observations

Schema source of truth: `db/schema.ts`.

---

## The agent layer

**System:** the AI agent that VAs talk to lives at `lib/agent/`. It receives:
- A system prompt (built per-conversation) including active client context, period state, and ICP context
- A tool catalog of 16 tools (see `docs/agent-tool-catalog-v3.md`)
- The VA's message + conversation history

It returns:
- Tool calls (executed by orchestrator)
- Text responses (streamed to chat UI)

**The agent NEVER:**
- Sends a pitch directly (always queues for VA review)
- Sends a positive-reply response on client's behalf (only drafts for client review)
- Exceeds monthly quota
- Touches cross-client data
- Modifies billing
- Fabricates host context (returns "insufficient" instead)

**Pitch generation flow:**
1. Agent calls `find_podcasts` + `rank_podcasts_for_client`
2. VA picks targets in conversation
3. Agent calls `generate_pitches` with `step: 'step1'` (and for Step 2, after `find_host_personal_context` + `match_client_story_to_host`)
4. Pitches written to DB in `draft` status
5. Agent calls `queue_pitches_for_review` → status becomes `queued`
6. VA opens bulk review screen, approves
7. Send pipeline (Inngest) schedules and sends per cadence rules

---

## AI writer architecture

Pitch generation uses **framework injection**, not vector embeddings or fine-tuning.

1. Load current step-specific base prompt from `ai_prompts` (where `is_current = true AND step = 'step1' OR 'step2'`)
2. Pull 1-2 random frameworks from `ai_frameworks` where `is_active AND step IN (matching_step, 'either')`, weighted by `weight` column
3. Optionally pull a random chunk from `ai_training_docs`
4. Inject all into the LLM prompt
5. Validate output:
   - Step 1: max 90 words body
   - Step 2: max 110 words body
   - No em dashes, no question openers, no banned phrases
6. Log to `ai_generations` for cost tracking + framework attribution

**Why this works:** the variation comes from sampling, not model behavior. Admin tunes by editing prompts/frameworks/docs in the UI — no retraining or redeploy needed.

---

## Send pipeline (v3)

Lives in `inngest/functions/send-pitches.ts`. Enforces:

- **Day-of-week:** Tue, Wed, Thu only
- **Time-of-day:** 9am-2pm host-local (defaults to US Eastern if host TZ unknown)
- **Jitter:** 45-90 seconds between sends in the same batch
- **Concurrency:** max 5 simultaneous sends across the system
- **Warmup mode:** if `client_profiles.new_sending_domain = true`, reduced cadence first 2 weeks (2-2-3-3 Standard, 4-4-7-7 Pro)
- **Quota check:** verified one more time at send-time (race protection)

After each Step 1 send, schedules a follow-up at +4-5 days. Follow-up checks for replies before sending; if a reply exists, skips silently.

---

## Onboarding email sequence

9 trial emails + 3 win-back emails, defined in `lib/resend.ts` and orchestrated by `inngest/functions/onboarding-emails.ts`.

Triggers (event-driven, not time-based):
- `client.signup` → welcome immediately; intake nudges at 6h/24h if not done; schedules day 5 and day 6
- `client.intake_completed` → researching email
- `client.first_pitches_sent` → first-pitches-sent email
- `client.trial_day_5` → mid-trial check-in
- `client.trial_day_6` → trial-converting-tomorrow
- `client.subscription_renewed` → welcome-paid; schedules first-month-milestone at +30d
- `client.subscription_canceled` → trial-ended; schedules winback at +30/+60/+90d
- `client.first_month_complete` → milestone email (only if still active)
- `client.winback_due` → winback_30/60/90 (only if still canceled)

Idempotent via `onboarding_email_sends` unique constraint on (client, template).

---

## Design system

**Marketing (PodEngine) + Client dashboard + Public media pages:**
- Cream/terracotta palette
- DM Serif Display + DM Sans (Hanken Grotesk variant acceptable)
- JetBrains Mono for code blocks
- Halftone dot textures as accent

**VA + Admin internal tools:**
- Neutral gray operator interfaces (no marketing palette bleed)
- Functional over beautiful

**FracReps (separate brand — different project):**
- Black-and-white editorial system (Instrument Serif, IBM Plex Sans/Mono, grain overlay)

---

## Communication style across surfaces

- **No em dashes** — anywhere, ever, in pitches or any external-facing copy
- **No "AI" language** in external-facing copy
- **Direct, declarative** in operational copy
- **Peer-to-peer tone with founders** in marketing and onboarding emails (we're operators talking to operators)
- **Quiet confidence**, not hype

---

## What's NOT in MVP (intentional exclusions)

- AI replying to host messages directly (V1)
- Cross-client analytics
- Public testimonials surface
- Affiliate / referral program
- Multi-language
- SMS / Slack notifications
- Custom prompts per client
- Annual paid-in-full discount
- Pause-and-resume billing (Stripe portal handles)
- Voice input in VA chat
- Mobile app

---

## File modification discipline

Per Courage's preference: **previously created files are never modified**. All revisions produce new files (e.g., `base-prompt-v1.ts` stays untouched; new work goes in `base-prompt-v2-step1.ts`).

In a build context, this means: when iterating in Cursor, prefer creating new files (e.g., `pitch-render-v2.tsx`) over editing existing ones, unless the edit is a bug fix.

---

## Operational docs (in `/docs`)

- `build-plan-v3.md` — week-by-week build sequence (10 weeks)
- `agent-tool-catalog-v3.md` — all 16 agent tools with schemas + guardrails
- `week1-cursor-prompts-v3.md` — Cursor Composer prompts for week 1
- `podengine-icp-analysis.md` — who PodEngine serves
- `podengine-pitch-templates.md` — the 2-step pitch framework + examples
- `podengine-onboarding-emails.md` — full content of 9-email sequence
- `podengine-send-strategy.md` — cadence, timing, jitter, warmup
- `podengine-one-pager.md` — positive-reply response flow
- `podengine-va-runbook.md` — VA day-to-day operations

When in doubt about implementation detail, check these docs before improvising.

---

## When asked to implement something

1. Read the relevant week's prompt in `week1-cursor-prompts-v3.md` if it's week 1
2. Check `agent-tool-catalog-v3.md` if it's an agent feature
3. Check the operational docs if it's a behavioral question (cadence, copy, intake fields)
4. Check `db/schema.ts` for what data structure to use
5. Don't invent new tables/columns without checking the build plan

When something feels ambiguous, ask before implementing. Don't guess on architecture.

---

## Final note

This codebase exists in service of one thing: **getting bootstrapped SaaS founders booked on podcasts that grow their business**. Every feature should be evaluated against that goal. If a feature doesn't make that easier or higher-quality, it doesn't belong in MVP.
