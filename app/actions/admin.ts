'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { users, clientProfiles } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Admin-only server actions: VA provisioning and client assignment.
 * Every action re-checks the caller's role server-side — middleware gating is a
 * convenience, not a security boundary.
 */

async function requireAdmin() {
  const me = await getCurrentUser();
  if (!me || me.role !== 'admin') {
    throw new Error('Not authorized');
  }
  return me;
}

type ActionResult = { ok: true } | { error: string };

/**
 * Create a VA: provision a Supabase auth user (magic-link, no password), mirror
 * the role into user_metadata, and insert the matching `users` row. Idempotent on
 * email — re-running promotes/links an existing row rather than erroring.
 */
export async function createVa(input: { email: string; fullName: string }): Promise<ActionResult> {
  await requireAdmin();

  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  if (!email || !fullName) return { error: 'Name and email are required.' };

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existing && existing.role !== 'va') {
    return { error: `That email already belongs to a ${existing.role}.` };
  }

  const admin = createSupabaseAdmin();
  // Create the auth user (or fetch the existing one) and stamp the va role.
  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: 'va' },
  });

  let authUserId = data?.user?.id;
  if (error) {
    // Likely already registered — look them up so we can still link the role.
    const { data: list } = await admin.auth.admin.listUsers();
    authUserId = list?.users.find((u) => u.email?.toLowerCase() === email)?.id;
    if (!authUserId) return { error: error.message };
    await admin.auth.admin.updateUserById(authUserId, {
      user_metadata: { full_name: fullName, role: 'va' },
    });
  }

  await db
    .insert(users)
    .values({ id: authUserId, email, fullName, role: 'va' })
    .onConflictDoUpdate({
      target: users.email,
      set: { role: 'va', fullName, ...(authUserId ? { id: authUserId } : {}) },
    });

  revalidatePath('/admin/vas');
  return { ok: true };
}

/** Activate / deactivate a VA without deleting their account or reassigning work. */
export async function setVaActive(vaId: string, isActive: boolean): Promise<ActionResult> {
  await requireAdmin();
  await db.update(users).set({ isActive }).where(and(eq(users.id, vaId), eq(users.role, 'va')));
  revalidatePath('/admin/vas');
  return { ok: true };
}

/** Assign (or unassign with vaId=null) a client profile to a VA. */
export async function assignClient(
  clientProfileId: string,
  vaId: string | null
): Promise<ActionResult> {
  await requireAdmin();

  if (vaId) {
    const va = await db.query.users.findFirst({ where: eq(users.id, vaId) });
    if (!va || va.role !== 'va') return { error: 'Pick a valid VA.' };
  }

  await db
    .update(clientProfiles)
    .set({ assignedVaId: vaId, updatedAt: new Date() })
    .where(eq(clientProfiles.id, clientProfileId));

  revalidatePath('/admin/clients');
  revalidatePath('/va');
  return { ok: true };
}
