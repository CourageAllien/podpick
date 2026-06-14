import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Three-role routing:
 *  - admin → can access everything
 *  - va    → /va/* only (plus shared /api/agent for chat)
 *  - client → /app/* only (plus their own /m/[slug])
 *  - unauth → marketing routes + auth routes only
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Public routes always permitted
  const isPublic =
    path === '/' ||
    path.startsWith('/m/') ||
    path.startsWith('/auth') ||
    path.startsWith('/api/stripe/webhooks') ||
    path.startsWith('/api/unipile/webhook') ||
    path.startsWith('/api/unipile/reply') ||
    path.startsWith('/api/inngest') ||
    path.startsWith('/_next') ||
    path.startsWith('/static');

  if (isPublic) return response;

  // Auth required for everything below
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/signin';
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }

  // Role check via JWT claim (set in users.role on signup)
  const role = user.user_metadata?.role || user.app_metadata?.role;

  if (path.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/app', request.url));
  }

  if (path.startsWith('/va') && role !== 'va' && role !== 'admin') {
    return NextResponse.redirect(new URL('/app', request.url));
  }

  if (path.startsWith('/app') && role !== 'client' && role !== 'admin') {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
