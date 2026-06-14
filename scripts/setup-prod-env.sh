#!/usr/bin/env bash
#
# Podpick — one-pass production env setup for Vercel.
#
# HOW TO USE:
#   1. Fill in every value between the quotes below. Leave the OPTIONAL ones
#      blank if you are not using them yet (Sentry/PostHog).
#   2. Make sure you are linked to the Vercel project:  vercel link
#   3. Run:  bash scripts/setup-prod-env.sh
#
# It pushes each value to the Vercel "production" environment. Re-running it
# replaces existing values (it removes-then-adds each key), so it is safe to
# run again after you rotate a key.
#
# NOTE: This writes to Vercel only. For LOCAL dev, copy these same values into
# .env.local instead. NEVER commit real secrets — this file is a template; the
# values you type are yours to keep out of git.

set -euo pipefail

# ─────────────────────────────────────────────────────────────
# FILL THESE IN  ▼▼▼
# ─────────────────────────────────────────────────────────────

# --- Database + Auth (Supabase) ---
DATABASE_URL=""                       # postgresql://postgres:[pw]@db.[ref].supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=""           # https://[ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""          # secret — used to provision VA accounts

# --- Stripe ---
STRIPE_SECRET_KEY=""                  # sk_live_...
STRIPE_PUBLISHABLE_KEY=""             # pk_live_...
STRIPE_WEBHOOK_SECRET=""              # whsec_... (from the webhook endpoint you create)
STRIPE_STANDARD_PRICE_ID=""           # price_...
STRIPE_PRO_PRICE_ID=""                # price_...
STRIPE_TRIAL_PRICE_ID=""              # price_... ($15 paid trial)

# --- Anthropic ---
ANTHROPIC_API_KEY=""                  # sk-ant-...

# --- Unipile (client inbox send/receive) ---
UNIPILE_API_KEY=""
UNIPILE_BASE_URL="https://api.unipile.com:9443"
UNIPILE_OAUTH_REDIRECT=""             # https://usepodpick.com/api/unipile/oauth-callback

# --- Rephonic (podcast discovery) ---
REPHONIC_API_KEY=""

# --- Resend (email) ---
RESEND_API_KEY=""                     # re_...
RESEND_FROM_EMAIL=""                  # hi@usepodpick.com (verified domain)
ADMIN_NOTIFICATION_EMAIL=""           # where ops alerts land

# --- Inngest (background jobs) ---
INNGEST_EVENT_KEY=""
INNGEST_SIGNING_KEY=""

# --- Quotas (monthly pitch caps per tier) ---
STANDARD_QUOTA="10"
PRO_QUOTA="25"

# --- App config ---
NEXT_PUBLIC_APP_URL="https://usepodpick.com"   # the production domain (NOT localhost)
NEXT_PUBLIC_SITE_NAME="Podpick"
NEXT_PUBLIC_BRAND_TAGLINE="Hand-written podcast pitches for bootstrapped SaaS founders"

# --- Optional / observability (leave blank to skip) ---
SENTRY_DSN=""
NEXT_PUBLIC_POSTHOG_KEY=""
NEXT_PUBLIC_POSTHOG_HOST="https://us.posthog.com"

# ─────────────────────────────────────────────────────────────
# FILL THESE IN  ▲▲▲   (nothing to edit below this line)
# ─────────────────────────────────────────────────────────────

REQUIRED_KEYS=(
  DATABASE_URL NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY
  STRIPE_SECRET_KEY STRIPE_PUBLISHABLE_KEY STRIPE_WEBHOOK_SECRET
  STRIPE_STANDARD_PRICE_ID STRIPE_PRO_PRICE_ID STRIPE_TRIAL_PRICE_ID
  ANTHROPIC_API_KEY
  UNIPILE_API_KEY UNIPILE_BASE_URL UNIPILE_OAUTH_REDIRECT
  REPHONIC_API_KEY
  RESEND_API_KEY RESEND_FROM_EMAIL ADMIN_NOTIFICATION_EMAIL
  INNGEST_EVENT_KEY INNGEST_SIGNING_KEY
  STANDARD_QUOTA PRO_QUOTA
  NEXT_PUBLIC_APP_URL NEXT_PUBLIC_SITE_NAME NEXT_PUBLIC_BRAND_TAGLINE
)
OPTIONAL_KEYS=( SENTRY_DSN NEXT_PUBLIC_POSTHOG_KEY NEXT_PUBLIC_POSTHOG_HOST )

# Pre-flight: refuse to run with any required value still blank.
missing=()
for key in "${REQUIRED_KEYS[@]}"; do
  [[ -z "${!key}" ]] && missing+=("$key")
done
if (( ${#missing[@]} > 0 )); then
  echo "✗ These required values are still blank — fill them in first:"
  printf '   - %s\n' "${missing[@]}"
  exit 1
fi

push() {
  local key="$1" val="$2"
  [[ -z "$val" ]] && { echo "  (skip $key — blank)"; return; }
  # Remove silently if it already exists, then add fresh.
  vercel env rm "$key" production --yes >/dev/null 2>&1 || true
  printf '%s' "$val" | vercel env add "$key" production >/dev/null
  echo "  ✓ $key"
}

echo "Pushing production env to Vercel…"
for key in "${REQUIRED_KEYS[@]}" "${OPTIONAL_KEYS[@]}"; do
  push "$key" "${!key}"
done

echo ""
echo "Done. Next:"
echo "  1. pnpm drizzle:push      # create the DB schema in Supabase"
echo "  2. pnpm db:seed           # create your admin login"
echo "  3. vercel deploy --prod   # redeploy so the new env takes effect"
