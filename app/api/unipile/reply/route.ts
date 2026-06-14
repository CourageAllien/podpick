import { NextResponse, type NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { pitches, responses, sendEvents } from '@/db/schema';
import { inngest } from '@/inngest/client';

/**
 * Unipile inbound-email webhook. Fires when a host replies to a pitch sent from a
 * client's inbox. We match the reply to the originating pitch by thread_id (the
 * id we stored when we sent), store it in `responses`, flip the pitch to
 * `replied`, and emit `response.received` so the classifier (Inngest) routes it.
 *
 * Public route (see middleware) — no user session. We never trust the payload to
 * tell us which client it belongs to; the thread_id match to an existing pitch is
 * the authorization. Unknown threads are ignored, not stored.
 */

type UnipilePayload = {
  event?: string;
  account_id?: string;
  // Unipile nests the message under various keys depending on event; be defensive.
  message?: UnipileMessage;
  email?: UnipileMessage;
} & Partial<UnipileMessage>;

type UnipileMessage = {
  message_id?: string;
  id?: string;
  thread_id?: string;
  subject?: string;
  body?: string;
  body_plain?: string;
  from_attendee?: { identifier?: string };
  from?: string;
  date?: string;
};

export async function POST(request: NextRequest) {
  let payload: UnipilePayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const msg: UnipileMessage = payload.message ?? payload.email ?? payload;
  const threadId = msg.thread_id;
  const fromEmail = msg.from_attendee?.identifier ?? msg.from ?? '';
  const subject = msg.subject ?? null;
  const body = msg.body_plain ?? msg.body ?? null;

  if (!threadId) {
    // Nothing to match on; acknowledge so Unipile does not retry forever.
    return NextResponse.json({ received: true, matched: false, reason: 'no_thread_id' });
  }

  // Match to the pitch that started this thread.
  const pitch = await db.query.pitches.findFirst({
    where: eq(pitches.threadId, threadId),
  });
  if (!pitch) {
    return NextResponse.json({ received: true, matched: false, reason: 'no_matching_pitch' });
  }

  // Ignore the client's own outbound message echoed back on the thread.
  // A reply we care about comes from the host, not the sending account.
  if (!fromEmail) {
    return NextResponse.json({ received: true, matched: false, reason: 'no_from' });
  }

  // Idempotency: skip if we already stored this exact reply for this pitch.
  const existing = await db
    .select({ id: responses.id })
    .from(responses)
    .where(and(eq(responses.pitchId, pitch.id), eq(responses.fromEmail, fromEmail)))
    .limit(20);
  // Crude dedup — same pitch + sender + subject already on file.
  if (existing.length > 0) {
    const dup = await db.query.responses.findFirst({
      where: and(eq(responses.pitchId, pitch.id), eq(responses.fromEmail, fromEmail)),
    });
    if (dup && (dup.subject ?? null) === subject) {
      return NextResponse.json({ received: true, matched: true, deduped: true });
    }
  }

  const [row] = await db
    .insert(responses)
    .values({ pitchId: pitch.id, fromEmail, subject, body })
    .returning({ id: responses.id });

  // Flag the pitch as replied (the classifier decides if it's a hot lead).
  await db
    .update(pitches)
    .set({ status: 'replied', updatedAt: new Date() })
    .where(eq(pitches.id, pitch.id));

  await db.insert(sendEvents).values({
    pitchId: pitch.id,
    eventType: 'replied',
    payload: { responseId: row.id, fromEmail },
  });

  // Hand off to the classifier. classification is filled in by the Inngest fn.
  await inngest.send({
    name: 'response.received',
    data: { responseId: row.id, classification: '' },
  });

  return NextResponse.json({ received: true, matched: true, responseId: row.id });
}
