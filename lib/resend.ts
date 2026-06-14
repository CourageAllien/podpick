/**
 * PodPick — Resend wrapper for transactional + onboarding emails
 *
 * Handles the 9 trial onboarding emails + 3 win-back emails defined in
 * Podpick-onboarding-emails.md. Each email is idempotent via the
 * onboarding_email_sends table (unique constraint on client+template).
 */

import { Resend } from 'resend';
import { db } from '@/db';
import { onboardingEmailSends, clientProfiles, users, subscriptions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set');
}

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'hi@usepodpick.com';
const FROM_NAME = 'Podpick';

export type OnboardingTemplate =
  | 'welcome'
  | 'intake_nudge'
  | 'intake_reminder'
  | 'researching'
  | 'first_pitches_sent'
  | 'mid_trial_checkin'
  | 'trial_converting_tomorrow'
  | 'welcome_paid'
  | 'trial_ended_canceled'
  | 'first_month_milestone'
  | 'winback_30'
  | 'winback_60'
  | 'winback_90';

export type SendOnboardingParams = {
  clientProfileId: string;
  template: OnboardingTemplate;
  variables?: Record<string, string>;  // Extra variables beyond what we look up
};

/**
 * Send an onboarding email. Idempotent — will refuse to send the same template
 * twice to the same client (relies on unique constraint in onboarding_email_sends).
 */
export async function sendOnboardingEmail(params: SendOnboardingParams): Promise<{
  sent: boolean;
  reason?: string;
  resendMessageId?: string;
}> {
  // 1. Check if we've already sent this template to this client
  const existing = await db.query.onboardingEmailSends.findFirst({
    where: and(
      eq(onboardingEmailSends.clientProfileId, params.clientProfileId),
      eq(onboardingEmailSends.template, params.template)
    ),
  });

  if (existing) {
    return { sent: false, reason: 'already_sent_for_this_template' };
  }

  // 2. Load full client + user + subscription context
  const client = await db.query.clientProfiles.findFirst({
    where: eq(clientProfiles.id, params.clientProfileId),
    with: { user: true } as any,  // typed via relations; placeholder
  });
  if (!client) {
    return { sent: false, reason: 'client_not_found' };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, client.userId),
  });
  if (!user) return { sent: false, reason: 'user_not_found' };

  const subscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.clientProfileId, params.clientProfileId),
  });

  // 3. Build email content per template
  const content = buildEmailContent(params.template, {
    name: extractFirstName(user.fullName ?? user.email),
    tier: subscription?.tier || 'standard',
    quota: subscription?.monthlyPitchQuota || 10,
    price: subscription?.tier === 'pro' ? 199 : 99,
    trialEndDate: subscription?.trialEndsAt
      ? formatDate(subscription.trialEndsAt)
      : 'in 7 days',
    intakeUrl: `${process.env.NEXT_PUBLIC_APP_URL}/app/intake`,
    dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/app`,
    mediaPageUrl: `${process.env.NEXT_PUBLIC_APP_URL}/m/${client.slug}`,
    trialUrl: `${process.env.NEXT_PUBLIC_APP_URL}/#pricing`,
    vaFirstName: (params.variables?.vaFirstName) || 'your VA',
    ...params.variables,
  });

  // 4. Send via Resend
  const result = await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: user.email,
    subject: content.subject,
    text: content.body,
    replyTo: 'hi@usepodpick.com',
  });

  if (result.error) {
    return { sent: false, reason: `resend_error: ${result.error.message}` };
  }

  // 5. Log to onboarding_email_sends for idempotency + audit
  await db.insert(onboardingEmailSends).values({
    clientProfileId: params.clientProfileId,
    template: params.template,
    resendMessageId: result.data?.id,
    metadata: {
      subject: content.subject,
      variableSnapshot: params.variables,
    },
  });

  return { sent: true, resendMessageId: result.data?.id };
}

// ───────────────────────────────────────────────────────────────
// EMAIL CONTENT — implements the 9-email trial flow
// (Full copy lives in Podpick-onboarding-emails.md; these are the templates)
// ───────────────────────────────────────────────────────────────

function buildEmailContent(
  template: OnboardingTemplate,
  v: Record<string, string | number>
): { subject: string; body: string } {
  switch (template) {
    case 'welcome':
      return {
        subject: `Welcome to Podpick, ${v.name}. Here's what's next.`,
        body: WELCOME_BODY(v),
      };
    case 'intake_nudge':
      return {
        subject: `Quick check: did the intake link land?`,
        body: INTAKE_NUDGE_BODY(v),
      };
    case 'intake_reminder':
      return {
        subject: `One quick thing before we can start`,
        body: INTAKE_REMINDER_BODY(v),
      };
    case 'researching':
      return {
        subject: `Got your intake. Here's what we're doing now.`,
        body: RESEARCHING_BODY(v),
      };
    case 'first_pitches_sent':
      return {
        subject: `Your first pitches just went out`,
        body: FIRST_PITCHES_SENT_BODY(v),
      };
    case 'mid_trial_checkin':
      return {
        subject: `How's Podpick treating you so far?`,
        body: MID_TRIAL_CHECKIN_BODY(v),
      };
    case 'trial_converting_tomorrow':
      return {
        subject: `Heads up: your trial converts tomorrow`,
        body: TRIAL_CONVERTING_BODY(v),
      };
    case 'welcome_paid':
      return {
        subject: `You're officially in. Here's what month one looks like.`,
        body: WELCOME_PAID_BODY(v),
      };
    case 'trial_ended_canceled':
      return {
        subject: `Trial ended. Here's everything we did.`,
        body: TRIAL_ENDED_BODY(v),
      };
    case 'first_month_milestone':
      return {
        subject: `30 days in. Here's where we are.`,
        body: FIRST_MONTH_BODY(v),
      };
    case 'winback_30':
      return {
        subject: `${v.name}, one quick thing about your old Podpick setup`,
        body: WINBACK_30_BODY(v),
      };
    case 'winback_60':
      return {
        subject: `What we'd do differently with you, ${v.name}`,
        body: WINBACK_60_BODY(v),
      };
    case 'winback_90':
      return {
        subject: `Last one from me, ${v.name}`,
        body: WINBACK_90_BODY(v),
      };
  }
}

// Body templates — full copy in Podpick-onboarding-emails.md
// These are condensed inline; expand or move to /lib/email-templates/ in production

const WELCOME_BODY = (v: any) => `Hi ${v.name},

You're in. Your trial just started.

Here's what happens next:

1. Fill the intake form (takes about 10 minutes)
   → ${v.intakeUrl}

2. Connect your Gmail or Outlook so we can send pitches from your inbox. The intake will walk you through this.

3. Within 5 business days, your first pitches go out.

We've already pre-assigned your VA based on your ${v.tier} tier. They'll introduce themselves once your intake is complete.

If anything's unclear, hit reply. We answer every email within 24 hours.

Courage
Founder, Podpick`;

const INTAKE_NUDGE_BODY = (v: any) => `Hi ${v.name},

Just checking the intake link didn't get filtered out:

→ ${v.intakeUrl}

It takes about 10 minutes. The faster we have your story, the sooner your first pitches go out.

Courage`;

const INTAKE_REMINDER_BODY = (v: any) => `Hi ${v.name},

Without the intake, we can't start. The form covers:

- Who you are (bio, photo, links)
- Three angles you want to be known for
- Your target listener
- Past podcast appearances (if any)
- A calendar link

10 minutes total. If anything's blocking you, hit reply and I'll help you through it.

→ ${v.intakeUrl}

Your trial ends ${v.trialEndDate}. Time matters here.

Courage`;

const RESEARCHING_BODY = (v: any) => `Hi ${v.name},

Got it. Your VA ${v.vaFirstName} is now:

1. Researching podcasts that fit your angles and audience
2. Drafting your first 5 pitches (custom for each show)
3. Setting up your public guest page at usepodpick.com

Your first pitches go out within 5 business days. You'll get an email the moment they ship.

Meanwhile, your dashboard is live:

→ ${v.dashboardUrl}

You can message ${v.vaFirstName} directly from there if anything comes up.

${v.vaFirstName}
Podpick`;

const FIRST_PITCHES_SENT_BODY = (v: any) => `Hi ${v.name},

Three pitches just went out. Here's where they landed:

${v.pitchList || '- [pitch 1]\n- [pitch 2]\n- [pitch 3]'}

Replies will come straight to your inbox. If a host says yes, you'll get a notification from us too so nothing slips.

Your dashboard shows the full pitch copy plus the rest of this week's queue:

→ ${v.dashboardUrl}

Two more pitches go out by end of week. We'll keep going through your trial.

${v.vaFirstName}`;

const MID_TRIAL_CHECKIN_BODY = (v: any) => `Hi ${v.name},

You're halfway through your trial. Quick check-in:

By now you've seen the pitches we sent on your behalf. Maybe a host has replied. Maybe not yet. Replies often take 5-10 days for the ones that land.

If anything's surprised you (positive or negative), I want to know. Reply to this email and I'll read it.

In three days, your trial converts to ${v.tier} at $${v.price}/mo. Nothing for you to do. It happens automatically. If you want to pause, upgrade to Pro, or cancel, you can do it from the dashboard:

→ ${v.dashboardUrl}

${v.vaFirstName}`;

const TRIAL_CONVERTING_BODY = (v: any) => `Hi ${v.name},

Tomorrow your trial converts to ${v.tier} at $${v.price}/mo. You'll be charged on ${v.trialEndDate}.

What you get going forward:

- ${v.quota} pitches per month (resets every billing cycle)
- Your dedicated VA continuing the work
- Your media page stays live at ${v.mediaPageUrl}
- Cancel anytime, no contract

If you want to change tiers, pause, or cancel before the charge, visit your billing settings:

→ ${v.dashboardUrl}/billing

No action needed if you want to continue.

${v.vaFirstName}`;

const WELCOME_PAID_BODY = (v: any) => `Hi ${v.name},

Your subscription just renewed. Welcome to Podpick proper.

Here's what to expect:

- ${v.quota} pitches per month, sent steadily over 3-4 weeks (not in one burst, which protects deliverability)
- Quota resets on ${v.nextRenewalDate || '[next renewal]'}
- Pause anytime if you're traveling, launching, or just need a break
- Your VA ${v.vaFirstName} keeps researching and pitching while you focus on your work

Your dashboard shows everything in real-time:

→ ${v.dashboardUrl}

If you want to dial something in (new angles, different podcast genres, target audience tweak), message ${v.vaFirstName} directly from the dashboard. They check in throughout the day.

${v.vaFirstName}`;

const TRIAL_ENDED_BODY = (v: any) => `Hi ${v.name},

Your trial ended. No charge will go through.

A quick recap of what we delivered:

- ${v.pitchCount || '[X]'} pitches sent on your behalf
- ${v.podcastCount || '[Y]'} podcasts targeted
- ${v.replyCount || '[Z]'} replies received

The pitches we drafted are still in your dashboard. If you want to keep them as reference for your own outreach later, they're yours:

→ ${v.dashboardUrl}

We won't bug you with sales emails. If anything changes for you, the door is open. Same trial pricing whenever you want to try again.

If you have 30 seconds, I'd love to know what didn't work. Reply to this email. Even one sentence helps.

Courage`;

const FIRST_MONTH_BODY = (v: any) => `Hi ${v.name},

You've been with Podpick for a month. Quick numbers:

- ${v.pitchCount || '[X]'} total pitches sent
- ${v.podcastCount || '[Y]'} podcasts targeted
- ${v.replyCount || '[Z]'} replies received
- ${v.bookings || '[B]'} podcasts booked or in conversation

Some of these are probably still working their way through host inboxes. Reply rates trend up over 4-6 weeks as more hosts get to your pitch.

If you want to refine direction (new angles, different niches, adjustments to who we're targeting), now's a great moment. Message ${v.vaFirstName} from your dashboard:

→ ${v.dashboardUrl}

${v.vaFirstName}`;

const WINBACK_30_BODY = (v: any) => `Hi ${v.name},

It's been a month since you stepped away from Podpick. Two things worth knowing:

1. Your media page at ${v.mediaPageUrl} is still live. We haven't taken it down.

2. The pitches we drafted for you are archived but still in your dashboard if you want them.

If timing's right to restart, the same $15 trial pricing applies. Just reply with "restart" and we'll spin it back up.

Courage`;

const WINBACK_60_BODY = (v: any) => `Hi ${v.name},

You left a couple months ago. I've been thinking about why.

If I had to guess, it was one of these:
- Reply rates weren't where you wanted
- Time wasn't right (launch, travel, busy quarter)
- You decided to handle outreach yourself
- Something else entirely

If you want to tell me which, reply with one word. I read every response personally.

If you ever want to come back, the door's open at the same trial price.

Courage`;

const WINBACK_90_BODY = (v: any) => `Hi ${v.name},

This is the last email I'll send. After this, you're off the list.

If Podpick ever fits your roadmap again, here's the trial link:
→ ${v.trialUrl}

Thanks for trying us out the first time.

Courage`;

// ───────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────

function extractFirstName(fullNameOrEmail: string): string {
  if (fullNameOrEmail.includes('@')) {
    return fullNameOrEmail.split('@')[0].split('.')[0];
  }
  return fullNameOrEmail.split(' ')[0];
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

/**
 * Convenience: send a generic transactional email (not onboarding-tracked).
 * Use for one-off notifications like positive-reply alerts to client.
 */
export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  body: string;
  replyTo?: string;
}): Promise<{ sent: boolean; resendMessageId?: string; error?: string }> {
  const result = await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: params.to,
    subject: params.subject,
    text: params.body,
    replyTo: params.replyTo || 'hi@usepodpick.com',
  });

  if (result.error) {
    return { sent: false, error: result.error.message };
  }
  return { sent: true, resendMessageId: result.data?.id };
}
