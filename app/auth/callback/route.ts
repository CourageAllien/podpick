import { NextResponse, type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { createSupabaseServer } from '@/lib/supabase/server';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Magic-link callback. Exchanges the auth code for a session, then ensures a
 * `users` row exists and that the role is mirrored into auth user_metadata so
 * middleware can route on it. Finally redirects by role.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const redirectParam = searchParams.get('redirect') || '/app';

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/signin`);
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/auth/signin?error=${encodeURIComponent(error.message)}`);
  }

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.redirect(`${origin}/auth/signin`);
  }

  // Determine/ensure our users row
  const seedAdminEmail = process.env.SEED_ADMIN_EMAIL?.toLowerCase();
  const email = (authUser.email || '').toLowerCase();

  const existing = await db.query.users.findFirst({ where: eq(users.id, authUser.id) });

  let role: 'admin' | 'va' | 'client';
  if (existing) {
    role = existing.role;
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, authUser.id));
  } else {
    // A seeded row (e.g. admin) may exist by email with a placeholder id.
    // Reconcile it to the real auth uid so RLS (auth.uid() = id) lines up.
    const byEmail = authUser.email
      ? await db.query.users.findFirst({ where: eq(users.email, authUser.email) })
      : null;

    if (byEmail) {
      role = byEmail.role;
      await db
        .update(users)
        .set({ id: authUser.id, lastLoginAt: new Date() })
        .where(eq(users.id, byEmail.id));
    } else {
      role = email && email === seedAdminEmail ? 'admin' : 'client';
      await db.insert(users).values({
        id: authUser.id,
        email: authUser.email!,
        fullName: (authUser.user_metadata?.full_name as string | undefined) ?? null,
        role,
        lastLoginAt: new Date(),
      });
    }
  }

  // Mirror role into auth metadata so middleware (which only sees the JWT) can route.
  if (authUser.user_metadata?.role !== role) {
    try {
      const admin = createSupabaseAdmin();
      await admin.auth.admin.updateUserById(authUser.id, {
        user_metadata: { ...authUser.user_metadata, role },
      });
    } catch (e) {
      console.error('Failed to mirror role into auth metadata', e);
    }
  }

  const destination =
    role === 'admin'
      ? '/admin'
      : role === 'va'
        ? '/va'
        : redirectParam.startsWith('/app')
          ? redirectParam
          : '/app';

  return NextResponse.redirect(`${origin}${destination}`);
}
