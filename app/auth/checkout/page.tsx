import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { startCheckout } from '@/app/actions/checkout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Entry point after sign-up. Reads ?tier=standard|pro, creates a Stripe Checkout
 * Session server-side, and redirects to Stripe. If unauthenticated, bounce to signin.
 */
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string; canceled?: string }>;
}) {
  const { tier: tierParam, canceled } = await searchParams;

  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/signin?redirect=/auth/checkout');
  }

  const tier: 'standard' | 'pro' = tierParam === 'pro' ? 'pro' : 'standard';

  if (!canceled) {
    const { url } = await startCheckout(tier);
    redirect(url);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Checkout canceled</CardTitle>
          <CardDescription>
            No charge was made. You can restart your {tier} plan trial whenever you are ready.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={`/auth/checkout?tier=${tier}`}>
            <button
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-terracotta-600"
              type="submit"
            >
              Restart checkout
            </button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
