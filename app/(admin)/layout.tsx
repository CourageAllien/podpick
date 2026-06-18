import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';

/**
 * Admin shell. Server-side role gate mirrors middleware so a stale JWT can never
 * expose admin surfaces. Slim top nav across the three admin sections.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentUser();
  if (!me) redirect('/auth/signin?redirect=/admin');
  if (me.role !== 'admin') redirect(me.role === 'va' ? '/va' : '/app');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-serif text-xl">
              PodEngine <span className="text-terracotta">Admin</span>
            </Link>
            <nav className="flex gap-1 text-sm">
              <Link className="rounded-md px-3 py-1.5 hover:bg-muted" href="/admin">
                Overview
              </Link>
              <Link className="rounded-md px-3 py-1.5 hover:bg-muted" href="/admin/clients">
                Clients
              </Link>
              <Link className="rounded-md px-3 py-1.5 hover:bg-muted" href="/admin/vas">
                VAs
              </Link>
              <Link className="rounded-md px-3 py-1.5 hover:bg-muted" href="/admin/training">
                Training
              </Link>
            </nav>
          </div>
          <form action="/auth/signout" method="post">
            <Button variant="ghost" size="sm" type="submit">
              Sign out
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
