/**
 * PodPick — Dunning emails
 *
 * When a renewal charge fails, Stripe keeps retrying the card on its own
 * schedule (smart retries). Each failed attempt fires client.payment_failed,
 * and we send the client a friendly heads-up that escalates in urgency with the
 * attempt number. When the charge finally succeeds, client.payment_recovered
 * fires and we confirm that service continues.
 *
 * These are transactional, not part of the onboarding template system, so they
 * are not gated by the once-per-template idempotency table. Stripe controls the
 * cadence, so we will not over-send.
 */

import { inngest } from '../client';
import { sendTransactionalEmail } from '@/lib/resend';
import { db } from '@/db';
import { clientProfiles, users, subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';

function firstName(nameOrEmail: string): string {
  const base = nameOrEmail.includes('@') ? nameOrEmail.split('@')[0] : nameOrEmail;
  return base.split(/[\s.]+/)[0] || 'there';
}

async function loadRecipient(clientProfileId: string) {
  const client = await db.query.clientProfiles.findFirst({
    where: eq(clientProfiles.id, clientProfileId),
  });
  if (!client) return null;
  const user = await db.query.users.findFirst({
    where: eq(users.id, client.userId),
  });
  if (!user) return null;
  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.clientProfileId, clientProfileId),
  });
  return { user, tier: sub?.tier ?? 'standard' };
}

const BILLING_URL = 'https://billing.stripe.com/p/login';

export const onPaymentFailed = inngest.createFunction(
  { id: 'dunning-on-payment-failed', name: 'Billing: payment failed' },
  { event: 'client.payment_failed' },
  async ({ event, step }) => {
    const { clientProfileId, attemptCount, nextAttemptAt } = event.data;

    const recipient = await step.run('load-recipient', async () =>
      loadRecipient(clientProfileId)
    );
    if (!recipient) return { skipped: 'recipient_not_found' };

    const name = firstName(recipient.user.fullName ?? recipient.user.email);
    const retryLine = nextAttemptAt
      ? `We will automatically try the card again on ${new Date(nextAttemptAt).toLocaleDateString(
          undefined,
          { month: 'long', day: 'numeric' }
        )}.`
      : 'We will try the card again shortly.';

    // Escalate tone by attempt number while staying warm.
    let subject: string;
    let opener: string;
    if (attemptCount <= 1) {
      subject = 'A quick heads-up about your payment';
      opener =
        'Your latest renewal payment did not go through. This is usually a small thing, like an expired card or a temporary hold.';
    } else if (attemptCount === 2) {
      subject = 'Your payment is still pending';
      opener =
        'We tried your card again and it still did not go through. Your pitching continues for now, but we want to get this sorted so nothing pauses.';
    } else {
      subject = 'Action needed to keep your pitching active';
      opener =
        'We have tried your card a few times now without success. To avoid a pause in your pitching, please update your payment details when you have a moment.';
    }

    const body = [
      `Hi ${name},`,
      '',
      opener,
      '',
      retryLine,
      '',
      `You can update your card here: ${BILLING_URL}`,
      '',
      'If you think this is a mistake or you need a hand, just reply to this email and we will help.',
      '',
      'Thanks,',
      'The PodEngine team',
    ].join('\n');

    await step.run('send-dunning', async () =>
      sendTransactionalEmail({
        to: recipient.user.email,
        subject,
        body,
      })
    );

    return { sent: true, attemptCount };
  }
);

export const onPaymentRecovered = inngest.createFunction(
  { id: 'dunning-on-payment-recovered', name: 'Billing: payment recovered' },
  { event: 'client.payment_recovered' },
  async ({ event, step }) => {
    const { clientProfileId } = event.data;

    const recipient = await step.run('load-recipient', async () =>
      loadRecipient(clientProfileId)
    );
    if (!recipient) return { skipped: 'recipient_not_found' };

    const name = firstName(recipient.user.fullName ?? recipient.user.email);
    const body = [
      `Hi ${name},`,
      '',
      'Good news, your payment went through and everything is back to normal. Your pitching continues without interruption.',
      '',
      'Thanks for taking care of that. If you have any questions, just reply here.',
      '',
      'The PodEngine team',
    ].join('\n');

    await step.run('send-recovered', async () =>
      sendTransactionalEmail({
        to: recipient.user.email,
        subject: 'You are all set, payment received',
        body,
      })
    );

    return { sent: true };
  }
);

export const DUNNING_FUNCTIONS = [onPaymentFailed, onPaymentRecovered];
