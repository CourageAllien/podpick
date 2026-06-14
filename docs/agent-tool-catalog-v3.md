# PodPick — Agent Tool Catalog v3

**Companion to v2:** `podpick-agent-tool-catalog.md`
**Major change from v2:** Adds Step 2 personalization tools, positive-reply lifecycle tools, send-schedule visibility tools, and step-awareness on `generate_pitches`.

**Total tools at MVP:** 16 (up from 11 in v2)

This catalog supersedes v2. The execution loop, system prompt structure, and safety architecture remain the same — only the tool surface changes.

---

## 0. What's new in v3

### Updated tools
- `generate_pitches` — adds required `step` parameter; Step 2 requires `host_personal_context_id` per pitch

### New tools
- `find_host_personal_context` — locates the host's LinkedIn/Substack/interview material for Step 2
- `match_client_story_to_host` — Claude pre-pass to pick which client story chapter applies
- `get_step2_eligible_hosts` — returns silent prospects from prior Step 1 attempts who have sufficient host_personal_context
- `get_planned_send_schedule` — returns the current period's send schedule for the client
- `draft_positive_reply` — when a positive reply lands, drafts the suggested response email for the client to review
- `forward_positive_reply_to_client` — replaces v2's `forward_response_to_client` with positive-reply-specific workflow

### Updated system prompt

The system prompt now includes:
- Current period's planned send schedule (week of period, remaining slots, warmup mode flag)
- Number of Step 2 eligible hosts available
- ICP context (if client_profiles.revenue_range is set, agent knows they're a SaaS founder)

---

## 1. Updated system prompt template

```
You are an operations assistant for PodPick, a managed podcast pitching service.

═══════════════════════════════════════════════════════════
ACTIVE CLIENT CONTEXT
═══════════════════════════════════════════════════════════
- Client: {client.full_name}
- Client ID: {client.id}
- Company: {client.company}
- Subscription tier: {subscription.tier} ({subscription.monthly_pitch_quota} pitches/month)
- Pitches used this period: {subscription.pitches_used_this_period}
- Pitches remaining this period: {quota_remaining}
- Current period: {period_start} → {period_end}
- Week of period: {week_of_period} of 4
- Client status: {client.status}
- Sending account connected: {boolean}

═══════════════════════════════════════════════════════════
PERIOD STATE
═══════════════════════════════════════════════════════════
- Planned sends this week: {targetThisWeek} (Step 1: {step1Count}, Step 2: {step2Count})
- Warmup mode: {warmup_mode} (new sending domain → reduced cadence)
- Step 2 eligible hosts available: {step2_eligible_count}

═══════════════════════════════════════════════════════════
ICP CONTEXT (use if relevant)
═══════════════════════════════════════════════════════════
- Revenue range: {revenue_range}
- Years in business: {years_in_business}
- Has been on podcast before: {has_been_on_podcast}

═══════════════════════════════════════════════════════════
YOUR JOB
═══════════════════════════════════════════════════════════
The VA gives you instructions in natural language. You execute them by calling
tools. You do not make strategic decisions for the client — those belong to the VA.

For ANY client-specific task: ALWAYS call get_client_info FIRST.

When generating pitches:
- Default to Step 1 unless explicitly asked for Step 2
- Respect the planned step1/step2 mix for this week
- Step 2 requires a host_personal_context_id — call find_host_personal_context first
- Never exceed the planned send schedule without manual_override

═══════════════════════════════════════════════════════════
ABSOLUTE LIMITS
═══════════════════════════════════════════════════════════
You CANNOT:
1. Send pitches directly. Only queue them for VA review.
2. Exceed monthly quota. Check before queueing.
3. Access clients other than the active one.
4. Make billing or subscription changes.
5. Send emails on client's behalf without explicit approval flow.
6. Modify client intake without VA instruction.
7. Make strategic decisions (which client to work, which niche to drop, etc).

═══════════════════════════════════════════════════════════
QUOTA + SCHEDULE AWARENESS
═══════════════════════════════════════════════════════════
If asked to generate more than the planned cadence permits:
- Generate up to the cap, not more
- Tell the VA clearly: "Generated 7 of the 10 you asked for — that's
  this week's full Step 1 allocation."
- Offer to schedule overflow for next week
```

---

## 2. The 16 tools

### 2.1 `get_client_info` (unchanged)

[Same as v2.] Returns full intake + state including new fields: revenue_range, years_in_business, has_been_on_podcast, new_sending_domain.

---

### 2.2 `get_quota_remaining` (unchanged)

[Same as v2.]

---

### 2.3 `find_podcasts` (unchanged)

[Same as v2. Rephonic search with caching.]

---

### 2.4 `rank_podcasts_for_client` (unchanged)

[Same as v2.]

---

### 2.5 `list_unpitched_podcasts` (unchanged)

[Same as v2.]

---

### 2.6 `get_podcast_details` (unchanged)

[Same as v2.]

---

### 2.7 `generate_pitches` (UPDATED — adds step parameter)

**Purpose:** Bulk-generate pitches. Now requires explicit `step` per pitch.

**Input schema:**
```typescript
{
  podcast_pitches: Array<{
    podcast_id: string,
    step: 'step1' | 'step2',                  // NEW v3 — required
    angle_index: number,                       // 1, 2, or 3
    // Step 1 only:
    episode_to_reference?: number,             // 0 = latest, 1 = second-latest, etc.
    // Step 2 only:
    host_personal_context_id?: string,         // NEW v3 — required if step='step2'
    client_story_anchor?: string,              // NEW v3 — which chapter of client's story applies
    tone?: 'professional' | 'casual' | 'sharp',
    length?: 'short' | 'medium' | 'long'
  }>
}
```

**Output:**
```typescript
{
  generated: Array<{
    pitch_id: string,
    podcast_id: string,
    step: 'step1' | 'step2',                   // NEW v3
    subject: string,
    body: string,
    angle_used: number,
    framework_used: string[],
    word_count: number
  }>,
  failed: Array<{ podcast_id: string; step: string; reason: string }>,
  quota_check: { requested, quota_available, actually_generated }
}
```

**Guardrails:**
- Step 2 pitches without host_personal_context_id fail validation
- Each pitch validates against step-specific rules (Step 1 max 90 words, Step 2 max 110)
- All other v2 guardrails apply

---

### 2.8 `queue_pitches_for_review` (unchanged)

[Same as v2.]

---

### 2.9 `list_responses` (unchanged)

[Same as v2.]

---

### 2.10 `get_response_details` (unchanged)

[Same as v2.]

---

### 2.11 `forward_response_to_client` (LIGHT UPDATE — used for non-positive)

Now used for soft-no, hard-no, question, booking_inquiry. Positive replies use the new `forward_positive_reply_to_client` workflow which involves the drafted response.

---

### 2.12 `find_host_personal_context` (NEW)

**Purpose:** Locate the host's personal material (LinkedIn posts, Substack pieces, interview quotes, journey arc) for Step 2 pitch personalization.

**Input schema:**
```typescript
{
  podcast_id: string,
  refresh?: boolean   // default false — if true, re-scrape even if cached
}
```

**Output:**
```typescript
{
  podcast_id: string,
  has_sufficient_context: boolean,
  context: {
    linkedin_url?: string,
    linkedin_summary?: string,
    recent_posts: Array<{
      source: 'linkedin' | 'substack' | 'twitter' | 'medium',
      title: string,
      body: string,
      url: string,
      date: string
    }>,
    interview_quotes: Array<{ source: string; quote: string; url?: string }>,
    personal_journey?: string
  }
}
```

**Behavior:**
- Returns cached `host_personal_contexts` row if present and `refresh=false`
- If no cached row OR `refresh=true`, triggers async scrape (returns "scraping in progress" + suggests revisiting in 5 min)
- `has_sufficient_context = true` means there's enough material for a real Step 2 pitch
- If `has_sufficient_context = false`, agent should report back to VA: "this host doesn't have public material for Step 2 — skip them"

**Guardrails:** Never invent host context. If scraping fails or returns nothing, report the gap.

---

### 2.13 `match_client_story_to_host` (NEW)

**Purpose:** Pre-pass that picks which chapter of the client's story best fits a specific host's personal context. Used before `generate_pitches` with step=step2.

**Input schema:**
```typescript
{
  client_profile_id: string,
  podcast_id: string,    // host_personal_contexts looked up via podcast
}
```

**Output:**
```typescript
{
  matched: boolean,
  client_story_anchor?: string,   // The chosen chapter — passed into generate_pitches
  reason?: string,                 // Why this anchor fits this host
  no_match_reason?: string         // If matched=false, why nothing connected
}
```

**Behavior:**
- Internally calls Claude with client intake + host personal context
- Returns the best-fitting story anchor OR explicit no-match
- If no match found, agent reports back: "couldn't find an honest bridge — skip Step 2 for this host"

**Why it's separate from generate_pitches:** keeps the matching logic auditable. Admin can spot-check the matches without inspecting each generated pitch.

---

### 2.14 `get_step2_eligible_hosts` (NEW)

**Purpose:** Returns hosts who received a Step 1 pitch that went silent (no reply in 10+ days) AND have sufficient `host_personal_context` for a Step 2 attempt.

**Input schema:**
```typescript
{
  limit?: number,   // default 20
}
```

**Output:**
```typescript
{
  eligible: Array<{
    podcast_id: string,
    podcast_title: string,
    host_name: string,
    original_pitch_id: string,
    days_since_original_send: number,
    days_since_followup: number,
    has_sufficient_context: boolean
  }>,
  total_eligible: number
}
```

**Behavior:**
- Filters by `host_personal_contexts.has_sufficient_context = true`
- Excludes hosts already targeted with Step 2 for this client
- Sorted by audience fit + freshness of original pitch

---

### 2.15 `get_planned_send_schedule` (NEW)

**Purpose:** Returns the agent's planned send schedule for the current period.

**Input schema:**
```typescript
{
  period?: 'current' | 'next'   // default 'current'
}
```

**Output:**
```typescript
{
  period_start: string,
  period_end: string,
  week_of_period: number,
  warmup_mode: boolean,
  weeks: [
    { week: 1, planned: 3, sent: 3, step1: 3, step2: 0 },
    { week: 2, planned: 3, sent: 2, step1: 2, step2: 1 },
    { week: 3, planned: 2, sent: 0, step1: 0, step2: 0 },
    { week: 4, planned: 2, sent: 0, step1: 0, step2: 0 }
  ],
  total_planned: number,
  total_sent: number,
  remaining_this_week: number,
  remaining_overall: number
}
```

**Use case:** When VA asks "what's this week look like?" or "how many more do we need to send this period?"

---

### 2.16 `draft_positive_reply` (NEW)

**Purpose:** When a positive reply lands, generate the suggested response email for the client to review and send (the one-pager response flow from `podengine-one-pager.md`).

**Input schema:**
```typescript
{
  response_id: string,            // The host's positive reply
  reply_intent?: 'send_one_pager' | 'address_question' | 'redirect_topic'
                                  // default: 'send_one_pager'
}
```

**Output:**
```typescript
{
  draft_subject: string,          // typically empty (in-thread reply)
  draft_body: string,             // ~70-100 words
  client_action_required: string  // human-readable: "review and send from your inbox"
  media_page_url: string,         // included in the draft
  calendar_link: string           // included in the draft
}
```

**Guardrails:**
- Stores draft in `positive_reply_lifecycle.va_draft_response`
- Sets lifecycle stage to 'va_drafted'
- Does NOT send the email — only drafts it
- The CLIENT must review and send themselves (the VA never sends positive responses on the client's behalf)

**Note:** This is the most consequential drafting workflow in the system. The draft becomes the message that determines whether a booking happens.

---

### 2.17 `forward_positive_reply_to_client` (REPLACES v2's positive flow)

**Purpose:** After `draft_positive_reply` runs, send the notification email to the client with the draft included.

**Input schema:**
```typescript
{
  lifecycle_id: string,       // from positive_reply_lifecycle
  va_note?: string            // optional VA addition to the notification email
}
```

**Output:**
```typescript
{
  notification_sent: boolean,
  client_email: string,
  lifecycle_stage_updated_to: 'client_notified'
}
```

**Behavior:**
- Sends client an email with the host's reply quoted + the VA's draft response embedded
- Updates `positive_reply_lifecycle.stage` to 'client_notified'
- Sets `client_notified_at = now`
- After this fires, the client takes over — they review the draft, edit if needed, and send from their own inbox

---

## 3. Updated tool execution loop

[Same as v2 — see `podpick-agent-tool-catalog.md` section 4 for the full orchestrator pseudocode. The only change is the larger `TOOL_SCHEMAS` array passed to `anthropic.messages.create`.]

---

## 4. Updated cost model (per agent turn)

| Scenario | Tool calls | Cost | Wall time |
|---|---|---|---|
| Simple query | 1 | $0.01-0.05 | 2-4s |
| Find + rank + generate 5 Step 1 pitches | 3-4 | $0.10-0.30 | 8-15s |
| Find Step 2 candidates + generate 8 Step 2 pitches | 5-7 (incl. find_host_personal_context per host) | $0.80-1.50 | 35-60s |
| Positive reply drafting | 2 (get_response_details + draft_positive_reply) | $0.05-0.10 | 4-6s |

Step 2 generation is the most expensive operation in v3 because each pitch requires the matching pre-pass plus the host context fetch. Budget accordingly.

---

## 5. Tool addition governance (unchanged)

Same rules as v2. Adding a new tool requires:
- Written purpose
- Input + output schemas
- Defined guardrails
- Test cases
- Review before deployment
- Entry in this catalog

Tool sprawl is the enemy. v3 is at 16 tools; we don't want to be at 30.

---

## 6. What the agent still cannot do (architectural enforcement)

Unchanged from v2 + additions:

- Send pitches directly (only queue for review)
- Send positive replies on client's behalf (only draft for client review)
- Exceed quota
- Access cross-client data
- Modify billing
- Delete data
- Fabricate host_personal_context (`find_host_personal_context` returns "insufficient" rather than inventing)

The tool architecture enforces these. Even if Claude's reasoning suggests doing one of these, the tools won't permit it.

---

## 7. The single highest-leverage tool

`draft_positive_reply` is the highest-leverage tool in the whole catalog.

The reasoning: 90% of the work in the entire pipeline is research + writing + sending. Only 10% is reply handling. But the 10% is where bookings are won or lost. A great `draft_positive_reply` workflow converts more positives into bookings — and bookings are what clients actually pay for.

Invest extra prompt engineering, more frameworks, more admin oversight on this tool than any other.
