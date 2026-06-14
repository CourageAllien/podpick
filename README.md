# PodPick v3

Internal app powering **PodEngine** — managed podcast pitching for bootstrapped SaaS founders.

> **Version:** 3.0 — adds two-step pitch system, full onboarding email automation, send-strategy enforcement, positive-reply lifecycle, ICP-driven defaults.

---

## Architecture at a glance

- **Three roles** — `admin` / `va` / `client` — routed by `middleware.ts`
- **Agent-first VA workspace** — VAs talk to an AI agent (16 tools) instead of using forms
- **Two-step pitch system** — Step 1 (episode-based) and Step 2 (host-based) with separate prompts
- **Background jobs via Inngest** — onboarding emails, send pipeline, weekly planning, monthly recaps
- **Send from client domain** — Unipile OAuth, never from a PodEngine alias
- **Framework injection (not fine-tuning)** — admin tunes pitch quality by editing prompts/frameworks live

See `CLAUDE.md` for full project context. See `docs/build-plan-v3.md` for week-by-week build sequence.

---

## Setup

### Prerequisites

- Node 20+
- pnpm 9+
- Supabase project (Postgres + auth)
- Stripe account (test mode for dev)
- Anthropic API key
- Unipile account + API key
- Rephonic API access
- Resend account + verified sending domain
- Inngest cloud account (free tier works for dev)

### Local install

```bash
pnpm install
cp .env.example .env.local
# Fill in all env vars (see below)
pnpm drizzle-kit push   # Push schema to your Supabase
pnpm db:seed             # Seed initial admin user + step prompts + SaaS frameworks
pnpm dev                 # Start Next.js
pnpm inngest:dev         # In a second terminal — start Inngest dev server
```

Visit `http://localhost:3000` for marketing site, `http://localhost:3000/admin` for admin (after seeding admin user).

---

## Environment variables

See `.env.example` for the full list. Key categories:

### Database + auth
```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Stripe
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STANDARD_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_TRIAL_PRICE_ID=price_...        # $15 paid trial
```

### Anthropic
```
ANTHROPIC_API_KEY=sk-ant-...
```

### Unipile
```
UNIPILE_API_KEY=...
UNIPILE_BASE_URL=https://api.unipile.com:9443
UNIPILE_OAUTH_REDIRECT=https://podengine.com/api/unipile/oauth-callback
```

### Rephonic
```
REPHONIC_API_KEY=...
```

### Resend (NEW v3)
```
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=hi@podengine.com
ADMIN_NOTIFICATION_EMAIL=hi@podengine.com
```

### Inngest (NEW v3)
```
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...
```

### Quotas (NEW v3 — env-driven, not hardcoded)
```
STANDARD_QUOTA=10
PRO_QUOTA=25
```

### App
```
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=PodEngine
```

---

## v3 module map

```
podpick-app-v3/
├── CLAUDE.md                   # Project context (read at session start)
├── .cursorrules                # Coding conventions
├── README.md                   # This file
├── .env.example                # All env vars
├── package.json
├── middleware.ts               # Role-based routing
├── drizzle.config.ts
├── db/
│   ├── schema.ts               # 19 tables (5 new in v3)
│   └── index.ts                # Drizzle client
├── lib/
│   ├── anthropic.ts            # Step-aware pitch writer (v3)
│   ├── stripe.ts               # $15 trial pattern
│   ├── unipile.ts              # OAuth-based email sender
│   ├── rephonic.ts             # Podcast discovery (cached)
│   ├── resend.ts               # NEW v3 — 9-email onboarding + winback
│   ├── supabase/
│   │   ├── server.ts
│   │   └── client.ts
│   └── prompts/
│       ├── base-prompt-v1.ts          # Legacy (kept for reference)
│       ├── base-prompt-v2-step1.ts    # NEW v3 — Step 1 episode-based
│       ├── base-prompt-v2-step2.ts    # NEW v3 — Step 2 host-based
│       └── framework-examples-saas.ts # NEW v3 — SaaS founder framework seeds
├── inngest/
│   ├── client.ts               # NEW v3
│   └── functions/
│       ├── onboarding-emails.ts       # NEW v3
│       ├── send-pitches.ts            # NEW v3
│       ├── send-pitch-followup.ts     # NEW v3
│       ├── weekly-pitch-plan.ts       # NEW v3
│       └── monthly-recap.ts           # NEW v3
└── docs/
    ├── build-plan-v3.md
    ├── agent-tool-catalog-v3.md
    ├── week1-cursor-prompts-v3.md
    ├── podengine-icp-analysis.md
    ├── podengine-pitch-templates.md
    ├── podengine-onboarding-emails.md
    ├── podengine-send-strategy.md
    ├── podengine-one-pager.md
    ├── podengine-va-runbook.md
    └── podpick-reply-subsequences.md
```

---

## Build sequence

10-week MVP plan in `docs/build-plan-v3.md`. Phase breakdown:

- **Phase 1 (weeks 1-3):** Foundation, auth, intake, media page, admin/VA app shells
- **Phase 2 (weeks 4-5):** Agent + Step 1 generation + bulk review + send pipeline
- **Phase 3 (weeks 6-7):** Step 2 + host personal context + positive-reply lifecycle
- **Phase 4 (weeks 8-10):** Onboarding email automation, send-strategy polish, admin dashboard, first 5 real clients

Each week has Cursor Composer prompts in `docs/week1-cursor-prompts-v3.md` (and equivalents for weeks 2-10).

---

## Common operations

### Seed the database

```bash
pnpm db:seed
```

Inserts:
- Initial admin user (email from env)
- Step 1 + Step 2 base prompts (from `lib/prompts/base-prompt-v2-step*.ts`)
- 9 SaaS-flavored frameworks (from `lib/prompts/framework-examples-saas.ts`)

### Run Inngest locally

```bash
pnpm inngest:dev
```

Inngest dev server listens at `http://localhost:8288`. Functions are auto-discovered from `inngest/functions/*`.

### Trigger an onboarding email manually (dev only)

```bash
curl -X POST http://localhost:3000/api/dev/trigger-event \
  -H "Content-Type: application/json" \
  -d '{"event": "client.signup", "data": {"clientProfileId": "<uuid>"}}'
```

### Generate a test pitch (dev only)

```bash
pnpm dev:test-pitch --client-id <uuid> --podcast-id <uuid> --step step1
```

---

## Testing locally

Manual QA flow for v3:

1. **Sign up** as a new client → trial starts → welcome email arrives within 30 sec
2. **Skip intake for 6 hours** (mock the clock) → intake_nudge email arrives
3. **Complete intake** → researching email arrives
4. **Admin assigns VA** → VA logs in, sees client in their dashboard
5. **VA opens agent chat** → asks "find 3 podcasts for this client" → agent runs `find_podcasts` + `rank_podcasts_for_client`
6. **VA asks "generate Step 1 pitches"** → 3 drafts created
7. **VA approves in bulk review** → pitches scheduled for next Tue/Wed/Thu
8. **Pitches send** → mock Unipile in dev to bypass real sends
9. **Mock a positive reply via webhook** → lifecycle row created
10. **VA drafts positive reply** → client receives notification + draft

---

## Production deploy

- `main` branch → Vercel production
- Stripe production keys
- Supabase production project (separate from staging)
- Inngest cloud production environment
- Resend production sending domain (verified SPF/DKIM/DMARC)
- Cron jobs (weekly pitch plan, monthly recap) automatically registered via Inngest

---

## Known limitations in v3

- No mobile app (web-responsive only)
- Reply triage requires VA — agent can't fully respond on client's behalf
- Cross-client analytics not exposed to clients (admin-only)
- Onboarding emails are English-only
- Stripe Customer Portal handles pause/resume (not custom UI)

These are intentional MVP exclusions, documented in `docs/build-plan-v3.md` section 6.

---

## Support

For project-specific questions or design decisions, check the docs first:
- Behavioral question (cadence, copy, intake) → `docs/podengine-*.md`
- Architecture question → `docs/build-plan-v3.md`
- Agent capability question → `docs/agent-tool-catalog-v3.md`
- ICP / positioning question → `docs/podengine-icp-analysis.md`
