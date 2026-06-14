import Link from 'next/link';
import { Button } from '@/components/ui/button';

/**
 * App-shell landing. The full marketing site is a separate static deploy;
 * this is the minimal entry into the authenticated product.
 */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-terracotta">Podpick</p>
      <h1 className="mt-4 max-w-2xl font-serif text-5xl leading-tight">
        Hand-written podcast pitches for bootstrapped SaaS founders
      </h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        We research the right shows, write pitches in your voice, and send them from your inbox.
        You just show up and talk.
      </p>
      <div className="mt-8 flex gap-3">
        <Button asChild size="lg">
          <Link href="/auth/checkout?tier=standard">Start your $15 trial</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/auth/signin">Sign in</Link>
        </Button>
      </div>
    </main>
  );
}
