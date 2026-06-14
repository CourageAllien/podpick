import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { positiveReplyLifecycle, responses, pitches, podcasts, clientProfiles } from '@/db/schema';
import { getCurrentClientProfile } from '@/lib/auth';
import { ClientLeadReview } from './lead-review';

export const dynamic = 'force-dynamic';

export default async function ClientLeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getCurrentClientProfile();
  if (!profile) redirect('/auth/signin?redirect=/app');

  const lifecycle = await db.query.positiveReplyLifecycle.findFirst({
    where: eq(positiveReplyLifecycle.id, id),
  });
  if (!lifecycle) notFound();
  if (lifecycle.clientProfileId !== profile.id) redirect('/app');

  const response = await db.query.responses.findFirst({
    where: eq(responses.id, lifecycle.responseId),
  });
  const pitch = await db.query.pitches.findFirst({ where: eq(pitches.id, lifecycle.pitchId) });
  const podcast = pitch
    ? await db.query.podcasts.findFirst({ where: eq(podcasts.id, pitch.podcastId) })
    : null;
  const client = await db.query.clientProfiles.findFirst({
    where: eq(clientProfiles.id, profile.id),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      <Link href="/app" className="text-sm text-muted-foreground hover:underline">
        ← Back to dashboard
      </Link>

      <div>
        <h1 className="font-serif text-3xl">A host wants you on their show</h1>
        <p className="text-sm text-muted-foreground">
          {podcast?.title ?? 'A podcast'}
          {podcast?.hostName ? ` · ${podcast.hostName}` : ''}
        </p>
      </div>

      <ClientLeadReview
        lifecycleId={lifecycle.id}
        stage={lifecycle.stage}
        hostName={podcast?.hostName ?? null}
        hostReply={response?.body ?? null}
        hostSubject={response?.subject ?? null}
        hostEmail={response?.fromEmail ?? null}
        draft={lifecycle.vaDraftResponse ?? ''}
        mediaPageUrl={`/m/${client?.slug ?? ''}`}
        bookingLink={client?.bookingLink ?? null}
        unipileConnected={Boolean(client?.unipileAccountId)}
        clientSentAt={lifecycle.clientSentAt ? new Date(lifecycle.clientSentAt).toISOString() : null}
      />
    </div>
  );
}
