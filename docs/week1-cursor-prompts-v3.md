# PodPick — Week 1 Cursor Composer Prompts v3

**Companion to:** `podpick-week1-cursor-prompts.md` (v1) and `podpick-week1-cursor-prompts-v2.md` (v2)
**Major change:** Updated to account for v3 schema (19 tables), new lib modules (resend, unipile, pdf, inngest), and step-aware prompt system.

Run these sequentially in Cursor Composer. Each builds on the last. Wait for each prompt's output to compile before proceeding to the next.

---

## Prompt 1 of 6 — Project scaffolding

> Set up a Next.js 15 project with the following:
>
> - App Router enabled, TypeScript strict mode
> - Tailwind CSS with the cream/terracotta palette already configured (cream #FAF6F0, terracotta #C76F4E)
> - shadcn/ui initialized
> - Drizzle ORM + postgres-js for Supabase Postgres
> - Inngest installed and configured (with /api/inngest route)
> - Resend installed
> - Stripe SDK installed
> - The full directory structure shown in README.md "v3 module map" — create empty placeholder files where needed
>
> Use pnpm. Use the exact package versions from `package.json`.
>
> Set up `middleware.ts` exactly as provided in the v3 starter, with three-role routing.
>
> Set up `db/schema.ts`, `db/index.ts`, and `drizzle.config.ts` exactly as provided.
>
> Set up `lib/supabase/server.ts` and `lib/supabase/client.ts` exactly as provided.
>
> Run `pnpm drizzle-kit push` to push the schema to Supabase. Confirm all 19 tables are created.

---

## Prompt 2 of 6 — Auth + role assignment

> Build magic-link authentication using Supabase Auth.
>
> Pages:
> - `/auth/signin` — email input, sends magic link
> - `/auth/callback` — handles the auth code exchange, redirects based on role
> - `/auth/signout` — clears session
>
> On first sign-in, if no row exists in `users` table for this auth user, create one with role determined by environment:
> - If email matches `SEED_ADMIN_EMAIL` → role = 'admin'
> - Otherwise → role = 'client' (default — VAs are created by admin later)
>
> Store role in both `users.role` and Supabase auth user_metadata so middleware can read it.
>
> Set up RLS policies in Supabase so:
> - users can only read their own row
> - admin can read all users
> - va can read users assigned to their clients
>
> Create a `seed.ts` script at `scripts/seed.ts` that:
> - Inserts the admin user (uses `SEED_ADMIN_EMAIL` / `SEED_ADMIN_NAME` env)
> - Inserts both step-1 and step-2 base prompts from `lib/prompts/base-prompt-v2-step*.ts` into `ai_prompts` table (is_current=true for both)
> - Inserts the 9 SaaS frameworks from `lib/prompts/framework-examples-saas.ts` into `ai_frameworks`

---

## Prompt 3 of 6 — Stripe + checkout + webhook + signup event

> Build the Stripe Subscriptions flow with the $15 paid trial pattern.
>
> Pages:
> - `/auth/checkout` — page that creates a Stripe Checkout Session and redirects, called after sign-up with a tier param
>
> Server action: `app/actions/checkout.ts`
> - Uses `lib/stripe.ts` `createCheckoutSession` exactly as provided in the v3 starter
> - Passes `clientProfileId` in metadata so the webhook can link sub to client
>
> Before checkout, create a stub `client_profiles` row with the user's id and a generated slug (kebab-case of full name + random suffix). Status = 'trialing' but no intake yet.
>
> Webhook handler at `app/api/stripe/webhooks/route.ts`:
> - Verify signature using `STRIPE_WEBHOOK_SECRET`
> - On `checkout.session.completed` → call `handleCheckoutCompleted` from `lib/stripe.ts`
> - On `customer.subscription.updated` → call `handleSubscriptionUpdated`
> - On `invoice.paid` (period rollover) → call `resetQuotaOnPeriodRollover`
>
> The Inngest events that fire as a result (`client.signup`, `client.subscription_renewed`, `client.subscription_canceled`, `client.period_rollover`) are handled by existing `inngest/functions/onboarding-emails.ts` and `inngest/functions/monthly-recap.ts` — do NOT rebuild those, just wire up the trigger.
>
> Smoke test: in Stripe CLI, run `stripe trigger checkout.session.completed` and confirm:
> 1. A subscription row is created
> 2. A `client.signup` event fires in Inngest dev dashboard
> 3. A welcome email is logged (Resend dashboard or local SMTP catcher)

---

## Prompt 4 of 6 — Intake form (ICP-extended)

> Build the multi-step intake form at `/app/intake` for newly-signed-up clients.
>
> Steps:
>
> **Step 1: Basics**
> - Full name (pre-filled from auth)
> - Company name
> - Website
> - LinkedIn URL (required)
> - Twitter URL (optional)
> - Headshot upload (Supabase Storage)
>
> **Step 2: Bio + angles**
> - One-line bio (max 140 chars)
> - Long bio (max 600 words)
> - Three angles (each: title + description, max 200 words per description)
> - Topics they can speak on (free-text array, comma-separated)
>
> **Step 3: Audience + goals**
> - Target audience (who do they want to reach)
> - Goals from podcast guesting (multiple choice + free text)
> - Sample questions they'd love a host to ask (3-5)
> - Topics to AVOID
>
> **Step 4: ICP qualifying (NEW v3)**
> - Revenue range (dropdown: $0-100K / $100-300K / $300-500K / $500K-1M / $1-2M / $2M+)
> - Years in business (number input)
> - "Have you been on a podcast before?" (yes/no with optional link if yes)
> - "Link to a tweet thread, blog post, or talk that captures your thesis" (URL)
>
> **Step 5: Past appearances (optional)**
> - Array of: podcast name, episode URL, date
>
> **Step 6: Sending setup**
> - Unipile OAuth connection — embeds the Unipile flow using `lib/unipile.ts` `createOAuthLink`
> - On success, store `unipile_account_id` on `client_profiles`
> - Mark `new_sending_domain` as TRUE by default (only set FALSE if admin overrides)
>
> **Step 7: Booking link**
> - Cal.com / Calendly / SavvyCal URL
>
> On final submit:
> - Update `client_profiles` with all fields
> - Set `intake_completed_at = now()`
> - Emit `client.intake_completed` Inngest event with `clientProfileId`
>
> Validation: use react-hook-form + zod. Each step is its own component. Progress bar at top.
>
> Show success state after submit with "Your VA is researching now — your first pitches go out within 5 business days."

---

## Prompt 5 of 6 — Public media page (+ print variant)

> Build the public media page at `/m/[slug]` and the print-optimized variant at `/m/[slug]/print`.
>
> The route fetches `client_profiles` by slug (publicly readable via RLS policy).
>
> Use the existing `podpick-media-page-template.html` as the design reference. Convert to a Next.js page (React + Tailwind).
>
> The main page:
> - Cream background with halftone dot accent
> - DM Serif Display for headings, DM Sans for body
> - Hero: headshot + name + one-line bio
> - "About" section with long bio
> - "Topics" — three angle cards
> - "Past appearances" if any (linked episodes)
> - "Sample questions" as a list
> - "Booking" CTA with calendar link
>
> The print variant (`/m/[slug]/print`):
> - Same content, optimized for A4 PDF
> - Page break before the past-appearances section if it exists
> - Black-and-cream only (no terracotta for print readability)
> - Footer with podengine.com brand mark
>
> Then build a server route at `/api/one-pager/[slug]/generate` that uses `lib/pdf.ts` `generateOnePagerPDF` to render the print page as PDF and return as `application/pdf` for download.
>
> Test: visit `/m/test-client` (after seeding a test client_profile), confirm the page renders. Visit `/m/test-client/print`, confirm the print variant renders. Hit `/api/one-pager/test-client/generate`, confirm a PDF downloads.

---

## Prompt 6 of 6 — Client dashboard shell + Inngest event handlers

> Build the client dashboard at `/app` (the main authenticated client view).
>
> Layout: top nav with "Pitches", "Hot Leads", "Messages", "Settings". Cream background. Use the existing Instantly-style campaign cards layout as reference (cards for each pitch's status).
>
> **Pitches tab** (default landing):
> - Trial progress banner if status='trialing' (days remaining, "your first pitches go out by [date]")
> - Sections: "Live" (sent + not yet replied), "Replied" (responses received), "Booked", "Drafts" (queued but not yet sent)
> - Each pitch shows: podcast name, host, sent date, step badge (Step 1 or Step 2), latest status
> - Clicking opens a side drawer with the full pitch + any response thread
>
> **Hot Leads tab**:
> - Shows positive_reply_lifecycle rows where stage IN (new, va_drafted, client_notified, response_sent)
> - For 'client_notified' state: shows the VA's drafted response with an "Edit + Send from My Inbox" button
> - The "send" action calls Unipile to send the response from the client's account, then updates lifecycle stage to 'response_sent'
>
> **Messages tab**:
> - Async chat with assigned VA (uses conversations + messages tables)
> - Realtime updates via Supabase Realtime subscription
>
> **Settings tab**:
> - Billing (links to Stripe Customer Portal)
> - Media page preview link
> - Update intake info
> - Sending account status (Unipile connection health)
>
> Now mount the Inngest serve handler at `/api/inngest/route.ts`:
> - Imports all functions from `inngest/functions/*` exports
> - Combines `ONBOARDING_FUNCTIONS`, `SEND_PIPELINE_FUNCTIONS`, `FOLLOWUP_FUNCTIONS`, `WEEKLY_PLAN_FUNCTIONS`, `MONTHLY_RECAP_FUNCTIONS`
> - Uses `serve()` from `inngest/next`
>
> Wire up the trial-progress banner to fire `client.first_pitches_sent` event from the admin "force test event" route (only used in dev) to verify the onboarding email chain works end-to-end.
>
> End of week 1 milestone:
> - New user can sign up, pay $15 trial, complete intake, receive 3-4 onboarding emails (welcome, intake_completed, etc.)
> - Public media page renders with their intake data
> - PDF download works
> - Client dashboard shows empty pitches state with trial-progress banner
> - All Inngest functions visible in Inngest dev dashboard
>
> Tests:
> - `pnpm typecheck` passes
> - Stripe test mode purchase flow works end-to-end
> - One-pager PDF generates locally without errors
> - Onboarding emails arrive at the right intervals when mocked

---

## What's NOT in week 1 (week 2+ scope)

- VA app at `/va/*` (week 3)
- Admin app at `/admin/*` (week 3)
- Agent chat interface (week 4)
- Pitch generation (week 5)
- Step 2 + host personal context (week 6)
- Reply tracking (week 7)
- Full onboarding email automation testing (week 8)
- Send strategy polish (week 9)
- Admin dashboard + first clients (week 10)

The week-by-week breakdown for weeks 2-10 lives in `build-plan-v3.md`. Each week has its own Cursor prompts file (created as needed).
