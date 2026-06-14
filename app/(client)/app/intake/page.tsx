import { redirect } from 'next/navigation';
import { getCurrentUser, getCurrentClientProfile } from '@/lib/auth';
import { IntakeForm } from './intake-form';

export default async function IntakePage({
  searchParams,
}: {
  searchParams: Promise<{ unipile?: string }>;
}) {
  const { unipile } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect('/auth/signin?redirect=/app/intake');

  const profile = await getCurrentClientProfile();
  // No subscription/profile yet → send them through checkout first.
  if (!profile) redirect('/auth/checkout?tier=standard');

  // Already completed → straight to dashboard.
  if (profile.intakeCompletedAt) redirect('/app');

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto mb-6 max-w-2xl">
        <h1 className="font-serif text-3xl">Tell us about you</h1>
        <p className="text-muted-foreground">
          This is what your VA uses to research shows and write pitches in your voice.
        </p>
      </div>
      <IntakeForm
        defaultFullName={user.fullName || ''}
        unipileConnected={unipile === 'connected' || !!profile.unipileAccountId}
      />
    </main>
  );
}
