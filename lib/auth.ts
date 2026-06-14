import { cache } from 'react';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users, clientProfiles } from '@/db/schema';
import { createSupabaseServer } from '@/lib/supabase/server';

/**
 * Server-only auth helpers. Resolves the Supabase auth user → our `users` row.
 * Cached per-request so repeated calls in a render tree hit the DB once.
 */

export const getAuthUser = cache(async () => {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getCurrentUser = cache(async () => {
  const authUser = await getAuthUser();
  if (!authUser) return null;
  const row = await db.query.users.findFirst({ where: eq(users.id, authUser.id) });
  return row ?? null;
});

export const getCurrentClientProfile = cache(async () => {
  const authUser = await getAuthUser();
  if (!authUser) return null;
  return (
    (await db.query.clientProfiles.findFirst({
      where: eq(clientProfiles.userId, authUser.id),
    })) ?? null
  );
});
