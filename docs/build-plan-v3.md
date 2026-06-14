# PodPick — Build Plan v3

**Companion to:** v1 (`podpick-build-plan.md`) and v2 (`podpick-build-plan-v2.md`)
**Brand:** PodEngine (customer-facing) / PodPick (internal app)
**Major change from v2:** Integrates the 2-step pitch system, full onboarding email automation, send-strategy enforcement at the platform level, the positive-reply / one-pager flow, ICP-driven product defaults (bootstrapped SaaS founders), and the operational doc set (VA runbook, send strategy, ICP analysis).
**Target MVP:** **10 weeks** — extended from v2's 8 weeks to absorb the new feature surface.
**Pricing locked:** $15 paid 7-day trial → Standard $99/mo (10 pitches) or Pro $199/mo (25 pitches).
**Primary ICP locked:** Bootstrapped SaaS founders running $300K-$2M ARR products.

---

## 0. What changed from v2

### Confirmed product direction (additive on v2)

1. **Two-step pitch system**
   - Step 1 = episode-based personalization (existing approach, ~70% of monthly quota in mature months)
   - Step 2 = host-based personalization using LinkedIn/Substack/interview context (~30% of mature months, used only on silent prospects from Step 1)
   - Month 1 of a client: 100% Step 1
   - Month 2+: 70/30 mix enforced by the agent automatically

2. **Full onboarding email automation**
   - 9 trial/post-conversion emails + 3 win-back emails
   - Triggered by database state changes (intake completed, first pitches sent, day 5 of trial, etc.)
   - Implemented via Inngest scheduled jobs + Resend send API

3. **Send-strategy enforcement at platform level**
   - No human decides what time of day to send — the pipeline enforces Tue/Wed/Thu, 9am-2pm host-local time, 45-90 second jitter
   - Standard tier defaults: 3-3-2-2 across 4 weeks
   - Pro tier defaults: 7-7-6-5 across 4 weeks
   - New-domain warmup mode: reduced volume in weeks 1-2 for clients without prior sending history

4. **Positive-reply / one-pager response flow**
   - The agent classifies positive replies and surfaces them in a "Hot Leads" section of the dashboard
   - VA drafts the suggested response email (in the client's voice), client reviews + sends
   - Auto-generates PDF version of media page on demand (Puppeteer at `/m/[slug]/print`)

5. **ICP-driven product defaults**
   - Intake form expanded with ICP-qualifying questions (ARR range, years in business, prior podcast appearances)
   - Rephonic search defaults tuned for SaaS founders (categories, audience size ranges)
   - AI framework library seeded with SaaS-founder-specific pitch frameworks
   - Onboarding email tone tuned to peer-to-peer-with-founders

6. **Operational doc integration**
   - VA runbook becomes a discoverable resource inside the VA app
   - Send strategy and pitch templates inform agent behavior
   - ICP analysis informs marketing copy and intake qualification

### Database schema additions vs v2

Five new tables + column additions:

```typescript
// Tracks every onboarding email sent — audit trail + idempotency
onboarding_email_sends {
  id, client_profile_id, email_template, sent_at, resend_message_id
}

// Caches host's personal context for Step 2 pitches
host_personal_contexts {
  id, podcast_id, host_name,
  linkedin_summary: text,        // scraped or manually added
  recent_posts: jsonb,           // [{ source, title, body, url, date }]
  interview_quotes: jsonb,
  personal_journey: text,
  last_refreshed_at, created_at
}

// Per-period planned send calendar per client
send_schedules {
  id, client_profile_id, subscription_period_start,
  planned_sends: jsonb,          // [{ scheduled_for, pitch_id?, type: 'step1'|'step2'|'followup' }]
  actual_sends: jsonb,           // populated as sends fire
  warmup_mode: boolean,
  manual_override: boolean,
  created_at, updated_at
}

// Tracks positive reply lifecycle from received → booking
positive_reply_lifecycle {
  id, response_id (fk responses), pitch_id, client_profile_id,
  stage: enum('new', 'va_drafted', 'client_notified', 'response_sent',
              'in_conversation', 'booked', 'recorded', 'live', 'dropped'),
  va_draft_response: text,        // VA's suggested reply
  client_sent_at, booked_for, recorded_at, episode_url,
  days_since_last_activity: int,
  created_at, updated_at
}

// Tracks monthly recap messages sent to clients
monthly_recaps {
  id, client_profile_id, period_start, period_end,
  pitches_sent: int, replies_received: int, bookings: int,
  observations: text,             // VA's note about what's working
  sent_at
}
```

Column additions:
- `ai_frameworks.step` — enum('step1', 'step2', 'either') — tags frameworks for which pitch step they fit
- `pitches.step` — enum('step1', 'step2') — which step this pitch represents
- `pitches.parent_pitch_id` — uuid nullable — for Step 2 retries, references the original Step 1 attempt
- `pitches.send_scheduled_for` — timestamp — set by the send pipeline when queueing
- `client_profiles.revenue_range` — text — for ICP qualification (e.g., '$300K-$500K')
- `client_profiles.years_in_business` — int
- `client_profiles.has_been_on_podcast` — boolean
- `client_profiles.new_sending_domain` — boolean — triggers warmup mode

---

## 1. Updated 10-week schedule

### Week 1 — Foundation + Subscriptions (unchanged from v2)

- Days 1-2: Repo, Supabase, Drizzle schema (now ~19 tables), three-role auth, middleware
- Days 3-5: Stripe Subscriptions ($15 paid trial, $99 / $199 tiers), webhooks, magic-link signup
- Days 6-7: Onboarding emails 1-3 wired into the welcome flow

**Demo:** Test purchase creates client_profile, magic link email arrives, intake nudge fires at 6h if intake not started.

### Week 2 — Client Intake + Media Page (extended)

- Days 1-3: Multi-step intake form, NOW with ICP-qualifying fields (revenue range, years in business, prior podcast experience)
- Days 4-5: Public media page at `/m/[slug]` + print-optimized variant at `/m/[slug]/print` (Puppeteer-ready)
- Days 6-7: Client dashboard skeleton — Instantly-style campaign cards layout, plus "Your media page" preview tile

**Demo:** Client fills extended intake, media page renders publicly, dashboard shows trial progress + media page link.

### Week 3 — Admin + VA App Foundation (unchanged from v2)

- Days 1-2: Admin app, KPIs, clients table, VA management
- Days 3-4: VA home with assigned clients + mini-stats
- Days 5-7: Per-client workspace shell, mirrors client dashboard for read-only view

**Demo:** Admin creates VA, assigns trialing client, VA logs in and sees client's intake summary + dashboard.

### Week 4 — Agent Orchestrator + Tools 1-6 (revised — Step-aware)

- Days 1-2: `lib/agent/orchestrator.ts` — tool-use loop, conversation state, system prompt builder
- Day 3: Tools 1-2 (`get_client_info`, `get_quota_remaining`)
- Day 4: Tool 3 (`find_podcasts`) — Rephonic wrapper with caching
- Day 5: Tool 4 (`rank_podcasts_for_client`) — uses intake + ICP defaults
- Days 6-7: Tools 5-6 (`list_unpitched_podcasts`, `get_podcast_details`) + chat UI shell with SSE streaming

**Demo:** VA types in chat "show me Dana's intake and find 5 marketing podcasts under 10K listeners" → agent runs the workflow → returns ranked candidate list.

### Week 5 — Step 1 Pitch Generation + Bulk Review (revised)

- Day 1: Tool 7 (`generate_pitches`) with **step parameter** — Step 1 uses `base-prompt-v2-step1.ts`
- Day 2: Tool 8 (`queue_pitches_for_review`) with send-schedule integration
- Days 3-5: Bulk review screen at `/va/clients/[id]/review` — the critical UI for approving 15-20 agent-generated pitches
- Days 6-7: Send pipeline (Inngest) — Tue/Wed/Thu enforcement, 9am-2pm timing, jittered sends, send_events logging

**Demo:** VA types "Generate this week's pitches for Dana, Step 1 only" → 3 drafts queued → VA approves → pitches send Tuesday/Wednesday/Thursday at proper times.

### Week 6 — Step 2 + Host Personal Context (NEW)

- Days 1-2: `host_personal_contexts` table + `lib/agent/tools/find_host_personal_context.ts`
- Days 3-4: `base-prompt-v2-step2.ts` — host-based pitch generation with personal context injection
- Day 5: Step 2 eligible host tracking — silent prospects from Step 1 auto-flagged after 10 days
- Days 6-7: Agent allocates 70/30 split when generating monthly batches; Step 2 follow-up scheduling

**Demo:** Month 2 begins for Dana. VA types "Generate next 3 pitches" → agent generates 2 Step 1 (new hosts) + 1 Step 2 (retry on silent prospect from month 1). Review screen shows step badges.

### Week 7 — Responses + Positive-Reply Lifecycle (NEW)

- Days 1-2: Reply tracking (Unipile webhook → match by Message-ID → store in `responses`)
- Days 3-4: Reply classification (Claude classifies: positive, soft_no, hard_no, auto, question, booking_inquiry)
- Day 5: Tools 9-11 (`list_responses`, `get_response_details`, `forward_response_to_client`)
- Days 6-7: Positive-reply lifecycle dashboard — Hot Leads section, VA drafts reply email, client review + send

**Demo:** Test reply arrives, agent classifies as positive, VA drafts response in dashboard, client receives notification with draft + edit-and-send flow.

### Week 8 — Onboarding Email Automation + Admin AI Training (revised)

- Days 1-3: Implement all 9 trial onboarding emails via Inngest + Resend — triggered by state changes (intake_complete, first_pitch_sent, day_5, day_6, day_8, day_30)
- Days 4-5: Win-back sequence (30/60/90 days post-cancel)
- Days 6-7: Admin AI training surface (`/admin/training/prompts`, `/admin/training/frameworks`, `/admin/training/docs`) — initial seed with SaaS-founder frameworks

**Demo:** Real trial signup → all 9 emails fire on their respective triggers. Admin adds a new framework → next pitch generation uses it.

### Week 9 — Client-VA Messaging + Send Strategy Polish (revised)

- Days 1-3: Async chat between client and VA (separate from agent chat)
- Days 4-5: Send-strategy controls: domain warmup detection, Standard 3-3-2-2 / Pro 7-7-6-5 enforcement, manual override capability
- Days 6-7: Edge cases — paused subscriptions, quota exhaustion gracefully handled, Unipile disconnects with re-auth flow

**Demo:** Quota exhaustion mid-month triggers agent explanation. New-domain client gets reduced first-week cadence with explanation in dashboard.

### Week 10 — Admin Dashboard + First Real Clients (revised)

- Days 1-3: Admin overview dashboard — MRR, churn, response rate, per-VA performance, agent usage costs, positive-reply funnel metrics
- Days 4-5: Billing maturity — failed payment retry, dunning emails, cancellation flow with retention message
- Days 6-7: Soft launch with 5 real bootstrapped SaaS founder clients (matched to ICP), document every issue

**Demo:** 5 paying SaaS founder clients, monthly cadence working, at least 1 booking confirmed, zero critical bugs in send pipeline.

---

## 2. The new critical paths in v3

### Critical path A: The 2-step prompt + framework system

Step 1 and Step 2 are different products from the agent's perspective. They need:
- Separate base prompts (`base-prompt-v2-step1.ts`, `base-prompt-v2-step2.ts`)
- Different framework pools (`ai_frameworks.step` filters which frameworks apply)
- Different validation (Step 2 allows slightly longer body)
- Different research workflows (Step 2 needs `host_personal_contexts` populated)

**Test the system with 20+ generations of each before week 8.** Track which step's frameworks produce higher reply rates.

### Critical path B: Onboarding email automation

The trial-to-paid conversion rate is the most important metric in the business. Onboarding emails are the single biggest lever on that rate.

Reliability checklist:
- [ ] Every email is idempotent — never sends twice for the same trigger
- [ ] Failed sends are retried with exponential backoff
- [ ] If a client cancels mid-sequence, future emails in the trial flow are killed (but win-back can start at day 30)
- [ ] Email content is personalized correctly (right name, right tier, right VA)
- [ ] Resend dashboard shows zero hard bounces from our domain

### Critical path C: Send-strategy enforcement

The send pipeline is the most architecturally sensitive part of v3. The rules (Tue/Wed/Thu, 9am-2pm local, 45-90 sec jitter, never weekends, Standard 3-3-2-2, Pro 7-7-6-5) MUST be enforced by the platform, not by VA discipline.

If the VA approves 7 pitches Tuesday morning, the pipeline schedules them across the next week per the cadence. The VA doesn't think about timing.

### Critical path D: Positive-reply lifecycle

This is the highest-leverage moment in the entire pipeline. From "host says interested" to "episode recorded" is where bookings live or die.

The flow must surface positive replies within 1 hour of receipt and prompt the VA to draft a response. Stale leads (>7 days since last activity) get flagged in the admin dashboard for follow-up nudges.

---

## 3. Updated cost model

### Fixed monthly costs (at ~30 paying clients)

| | v2 estimate | v3 estimate |
|---|---|---|
| Vercel Pro | $20 | $20 |
| Supabase Pro | $25 | $25 |
| Inngest | $0 | $25 (more jobs now) |
| Resend | $20 | $30 (more emails) |
| Unipile | $99 | $99 |
| Rephonic | $99-499 | $99-499 |
| Anthropic API (per-pitch generation) | $60 | $90 (Step 1 + Step 2 generation) |
| Anthropic API (agent chat) | $300-600 | $300-600 |
| Sentry, PostHog (free tiers) | $0 | $0 |
| Domain + misc | $10 | $10 |
| **Total fixed** | $630-1340 | **$700-1400** |

Marginal cost addition (~$50-75/mo) for noticeably more capability.

### Per-client unit economics (with v3 agent leverage)

Approximately same as v2 — the 2-step system increases reply rates without dramatically changing labor cost per client. Margins remain at ~52% Standard, ~44% Pro.

---

## 4. Risks introduced by v3 features

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Step 2 research is too expensive in operator time | Medium | Medium | Cap Step 2 attempts at 30% of monthly quota; skip Step 2 for hosts with no public personal material |
| Onboarding emails feel spammy or off-brand | Medium | High | A/B test Email 6 + 7 after first 50 trials; iterate copy |
| Send schedule conflicts with client's own outreach | Low | Low | Intake asks about prior sending history; warn clients about overlap |
| Positive-reply VA drafts feel "scripted" to clients | Medium | Medium | VA edits the template per-client; client always reviews before send |
| Agent's 70/30 Step 1/2 split is wrong for some clients | Low | Medium | Make override-able per-client by admin |
| New-domain warmup is too cautious / not cautious enough | Medium | Medium | Track deliverability per client domain; tune warmup rules in V1 |

---

## 5. Implementation order (strict)

### Phase 1: Weeks 1-3 (foundation, unchanged)
Build the foundation per v2's plan. No major changes.

### Phase 2: Weeks 4-5 (agent + Step 1)
Build the agent layer + Step 1 generation. Get a single client through the full flow before moving to Step 2.

### Phase 3: Weeks 6-7 (Step 2 + replies)
Add Step 2 + the positive-reply lifecycle. Test in isolation before adding onboarding emails.

### Phase 4: Weeks 8-10 (automation + polish)
Add onboarding email automation, send-strategy polish, admin dashboard, take first clients.

**Do NOT skip ahead.** Building onboarding emails before the agent loop works produces unused infrastructure. Building Step 2 before Step 1 produces broken Step 1.

---

## 6. What's NOT in MVP v3 (intentional exclusions)

- Reply triage by AI without VA review (V1 — agent can't reply on client's behalf)
- Cross-client analytics ("compare your reply rate to other clients in your tier")
- Public testimonials surface
- Affiliate / referral program implementation
- Multi-language support
- SMS notifications
- Slack notifications for VAs
- Custom AI prompts per client
- Annual paid-in-full discount
- Pause-and-resume billing logic (Stripe Customer Portal handles)
- Voice input in VA chat
- Image attachments in VA chat
- Mobile app

---

## 7. The single biggest open question (still)

**Will the agent + framework injection + 2-step system produce consistently high-quality pitches at scale?**

This was the open question in v2 and remains so in v3. The 2-step system gives us two attempts per host, which improves the floor — but it also doubles the surface area for quality drift.

Mitigation plan unchanged:
- Build review screen with strong defaults (assume 30% edit rate)
- Track which frameworks correlate with rejection
- QA sample 10% of approved pitches weekly
- If reply rate drops 30%+ below manual baseline, fall back to "agent suggests podcasts, VA writes pitches manually"

---

## 8. Success criteria at end of week 10

**Quantitative:**
- 5 real paying SaaS founder clients (trial or paid)
- At least 100 agent-generated pitches sent across all clients
- At least 30 Step 2 pitches (proves the 2-step system works end-to-end)
- All 9 onboarding emails firing correctly with > 95% delivery rate
- VA review approval rate ≥ 70%
- Reply rate ≥ 8% in month 1 (baseline; trend up to 12-20% by month 3)
- Send pipeline executes 100% of scheduled sends within their day-of-week + time-of-day windows
- Zero critical bugs in send pipeline or quota enforcement
- At least 1 positive reply forwarded to client + drafted response sent

**Qualitative:**
- VAs report the chat + 2-step system feels faster than v2's single-step approach
- Clients can see their planned send schedule on the dashboard (transparency)
- Admin can see MRR, churn, reply rate, and positive-reply funnel in one glance
- At least 1 framework added by admin via training UI visibly improved subsequent pitches
- Onboarding emails feel personal, not automated, to test users

If hit by week 10, scale acquisition. If not, debug specific shortfalls.

---

## 9. References to operational docs

These docs live alongside the build plan and inform implementation details:

| Doc | What it covers |
|---|---|
| `podengine-icp-analysis.md` | Who PodEngine serves and how to qualify them |
| `podengine-pitch-templates.md` | The 2-step pitch framework with examples |
| `podengine-onboarding-emails.md` | Full content of the 9 trial emails + win-back sequence |
| `podengine-send-strategy.md` | Cadence, timing, jitter, warmup, Step 1/2 ratios |
| `podengine-one-pager.md` | Positive-reply response flow + PDF generation |
| `podengine-va-runbook.md` | Day-to-day VA workflow + edge cases |
| `podpick-reply-subsequences.md` | Cold outreach reply handling for PodEngine acquisition |
| `podpick-agent-tool-catalog-v3.md` | All agent tools with schemas + guardrails |
| `podpick-week1-cursor-prompts-v3.md` | Week 1 Cursor prompts for v3 foundation |

All operational details that affect specific feature behavior live in these docs. The build plan is the integration narrative; the docs are the canonical source.
