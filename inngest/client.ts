/**
 * PodPick — Inngest client
 *
 * Central Inngest instance used by all background jobs.
 */

import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'podpick',
  eventKey: process.env.INNGEST_EVENT_KEY,
});

// ───────────────────────────────────────────────────────────────
// EVENT NAMES — typed event vocabulary for the system
// ───────────────────────────────────────────────────────────────

export type AppEvents = {
  // Onboarding flow
  'client.signup': {
    data: { clientProfileId: string };
  };
  'client.intake_completed': {
    data: { clientProfileId: string };
  };
  'client.first_pitches_sent': {
    data: { clientProfileId: string; pitchIds: string[] };
  };
  'client.trial_day_5': {
    data: { clientProfileId: string };
  };
  'client.trial_day_6': {
    data: { clientProfileId: string };
  };
  'client.subscription_renewed': {
    data: { clientProfileId: string };
  };
  'client.subscription_canceled': {
    data: { clientProfileId: string };
  };
  'client.first_month_complete': {
    data: { clientProfileId: string };
  };
  'client.winback_due': {
    data: { clientProfileId: string; stage: 30 | 60 | 90 };
  };

  // Billing / dunning
  'client.payment_failed': {
    data: { clientProfileId: string; attemptCount: number; nextAttemptAt: string | null };
  };
  'client.payment_recovered': {
    data: { clientProfileId: string };
  };

  // Send pipeline
  'pitch.queued_for_send': {
    data: { pitchId: string };
  };
  'pitch.scheduled': {
    data: { pitchId: string; sendAt: string };
  };
  'pitch.followup_due': {
    data: { pitchId: string };
  };
  'pitch.sent': {
    data: { pitchId: string };
  };

  // Weekly planning
  'client.weekly_plan_due': {
    data: { clientProfileId: string };
  };

  // Monthly recap
  'client.period_rollover': {
    data: { clientProfileId: string; periodEnd: string };
  };

  // Response tracking
  'response.received': {
    data: { responseId: string; classification: string };
  };
  'positive_reply.va_draft_ready': {
    data: { lifecycleId: string };
  };
  'positive_reply.stale': {
    data: { lifecycleId: string; daysStale: number };
  };
};
