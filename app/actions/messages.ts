'use server';

import { revalidatePath } from 'next/cache';
import { and, asc, eq, isNull, ne, sql } from 'drizzle-orm';
import { db } from '@/db';
import { conversations, messages, clientProfiles } from '@/db/schema';
import { getCurrentUser, getCurrentClientProfile } from '@/lib/auth';

/**
 * Async client<->VA messaging. This is a plain message thread per client, kept
 * deliberately separate from the VA agent chat (which is ephemeral SSE and never
 * touches these tables). One conversation row exists per client; both sides post
 * into it and unread counters track who has seen what.
 */

type ActionResult = { ok: true } | { error: string };

export type ThreadMessage = {
  id: string;
  senderId: string;
  senderRole: 'client' | 'va' | 'admin';
  body: string;
  createdAt: string;
};

/** Find the client's conversation, creating it (bound to their assigned VA) if needed. */
async function getOrCreateConversation(clientProfileId: string, vaId: string | null) {
  const existing = await db.query.conversations.findFirst({
    where: eq(conversations.clientProfileId, clientProfileId),
  });
  if (existing) return existing;

  const [created] = await db
    .insert(conversations)
    .values({ clientProfileId, vaId })
    .returning();
  return created;
}

// ───────────────────────────────────────────────────────────────
// LOADING
// ───────────────────────────────────────────────────────────────

export async function loadThreadMessages(conversationId: string): Promise<ThreadMessage[]> {
  // This is an exported server action, so it is a public endpoint: never trust
  // the conversationId alone. Confirm the caller actually belongs to this thread
  // (owning client, an admin, or the VA assigned to the client) before returning
  // any messages. On any failure we return an empty thread rather than leak.
  const me = await getCurrentUser();
  if (!me) return [];

  const convo = await db.query.conversations.findFirst({
    where: eq(conversations.id, conversationId),
  });
  if (!convo) return [];

  if (me.role !== 'admin') {
    const client = await db.query.clientProfiles.findFirst({
      where: eq(clientProfiles.id, convo.clientProfileId),
    });
    if (!client) return [];
    const isOwningClient = me.role === 'client' && client.userId === me.id;
    const isAssignedVa = me.role === 'va' && client.assignedVaId === me.id;
    if (!isOwningClient && !isAssignedVa) return [];
  }

  const rows = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt));

  return rows.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    senderRole: m.senderRole,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
  }));
}

// ───────────────────────────────────────────────────────────────
// CLIENT SIDE
// ───────────────────────────────────────────────────────────────

export async function sendClientMessage(body: string): Promise<ActionResult> {
  const profile = await getCurrentClientProfile();
  if (!profile) return { error: 'Not authenticated.' };

  const text = body.trim();
  if (!text) return { error: 'Write a message first.' };
  if (text.length > 5000) return { error: 'Message is too long.' };

  const convo = await getOrCreateConversation(profile.id, profile.assignedVaId ?? null);

  await db.insert(messages).values({
    conversationId: convo.id,
    senderId: profile.userId,
    senderRole: 'client',
    body: text,
  });

  await db
    .update(conversations)
    .set({
      lastMessageAt: new Date(),
      unreadCountVa: sql`${conversations.unreadCountVa} + 1`,
    })
    .where(eq(conversations.id, convo.id));

  revalidatePath('/app');
  return { ok: true };
}

export async function markClientRead(): Promise<ActionResult> {
  const profile = await getCurrentClientProfile();
  if (!profile) return { error: 'Not authenticated.' };

  const convo = await db.query.conversations.findFirst({
    where: eq(conversations.clientProfileId, profile.id),
  });
  if (!convo) return { ok: true };

  await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(messages.conversationId, convo.id),
        ne(messages.senderRole, 'client'),
        isNull(messages.readAt)
      )
    );
  await db
    .update(conversations)
    .set({ unreadCountClient: 0 })
    .where(eq(conversations.id, convo.id));

  return { ok: true };
}

// ───────────────────────────────────────────────────────────────
// VA SIDE
// ───────────────────────────────────────────────────────────────

async function authorizeVaForClient(clientProfileId: string) {
  const me = await getCurrentUser();
  if (!me || (me.role !== 'va' && me.role !== 'admin')) {
    return { ok: false as const, error: 'Not authorized.' };
  }
  const client = await db.query.clientProfiles.findFirst({
    where: eq(clientProfiles.id, clientProfileId),
  });
  if (!client) return { ok: false as const, error: 'Client not found.' };
  if (me.role === 'va' && client.assignedVaId !== me.id) {
    return { ok: false as const, error: 'Not assigned to this client.' };
  }
  return { ok: true as const, me, client };
}

export async function sendVaMessage(clientProfileId: string, body: string): Promise<ActionResult> {
  const auth = await authorizeVaForClient(clientProfileId);
  if (!auth.ok) return { error: auth.error };

  const text = body.trim();
  if (!text) return { error: 'Write a message first.' };
  if (text.length > 5000) return { error: 'Message is too long.' };

  const convo = await getOrCreateConversation(
    clientProfileId,
    auth.me.role === 'va' ? auth.me.id : auth.client.assignedVaId ?? null
  );

  await db.insert(messages).values({
    conversationId: convo.id,
    senderId: auth.me.id,
    senderRole: auth.me.role === 'admin' ? 'admin' : 'va',
    body: text,
  });

  await db
    .update(conversations)
    .set({
      lastMessageAt: new Date(),
      unreadCountClient: sql`${conversations.unreadCountClient} + 1`,
      ...(auth.me.role === 'va' ? { vaId: auth.me.id } : {}),
    })
    .where(eq(conversations.id, convo.id));

  revalidatePath(`/va/clients/${clientProfileId}/messages`);
  return { ok: true };
}

export async function markVaRead(clientProfileId: string): Promise<ActionResult> {
  const auth = await authorizeVaForClient(clientProfileId);
  if (!auth.ok) return { error: auth.error };

  const convo = await db.query.conversations.findFirst({
    where: eq(conversations.clientProfileId, clientProfileId),
  });
  if (!convo) return { ok: true };

  await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(messages.conversationId, convo.id),
        eq(messages.senderRole, 'client'),
        isNull(messages.readAt)
      )
    );
  await db
    .update(conversations)
    .set({ unreadCountVa: 0 })
    .where(eq(conversations.id, convo.id));

  return { ok: true };
}
