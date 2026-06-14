import { NextResponse, type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { clientProfiles } from '@/db/schema';

/**
 * Unipile hosted-auth notify webhook. When a client finishes connecting their
 * inbox, Unipile posts the new account here. We identify the client via the
 * `name` field (we set it to clientProfileId in createOAuthLink) and store the
 * account id so the send pipeline can mail from their inbox.
 *
 * Public route (see middleware) — no user session. Validate by matching the
 * known clientProfileId rather than trusting arbitrary payloads.
 */
export async function POST(request: NextRequest) {
  let payload: { account_id?: string; name?: string; status?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { account_id: accountId, name: clientProfileId } = payload;
  if (!accountId || !clientProfileId) {
    return NextResponse.json({ error: 'Missing account_id or name' }, { status: 400 });
  }

  const profile = await db.query.clientProfiles.findFirst({
    where: eq(clientProfiles.id, clientProfileId),
  });
  if (!profile) {
    return NextResponse.json({ error: 'Unknown client profile' }, { status: 404 });
  }

  await db
    .update(clientProfiles)
    .set({ unipileAccountId: accountId, updatedAt: new Date() })
    .where(eq(clientProfiles.id, clientProfileId));

  return NextResponse.json({ received: true });
}
