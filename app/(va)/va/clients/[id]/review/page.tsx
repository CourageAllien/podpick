import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { clientProfiles, users, pitches, podcasts, subscriptions } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { ReviewList } from './review-list';

export const dynamic = 'force-dynamic';

export default async function VaReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await getCurrentUser();
  if (!me) redirect('/auth/signin');

  const rows = await db
    .select({
      id: clientProfiles.id,
      company: clientProfiles.company,
      assignedVaId: clientProfiles.assignedVaId,
      unipileAccountId: clientProfiles.unipileAccountId,
      fullName: users.fullName,
    })
    .from(clientProfiles)
    .leftJoin(users, eq(clientProfiles.userId, users.id))
    .where(eq(clientProfiles.id, id))
    .limit(1);

  const client = rows[0];
  if (!client) notFound();
  if (me.role === 'va' && client.assignedVaId !== me.id) redirect('/va');

  const [drafts, sub] = await Promise.all([
    db
      .select({
        id: pitches.id,
        step: pitches.step,
        subject: pitches.subject,
        body: pitches.body,
        angleUsed: pitches.angleUsed,
        createdAt: pitches.createdAt,
        podcastTitle: podcasts.title,
        hostName: podcasts.hostName,
        hostEmails: podcasts.hostEmails,
      })
      .from(pitches)
      .innerJoin(podcasts, eq(pitches.podcastId, podcasts.id))
      .where(and(eq(pitches.clientProfileId, id), eq(pitches.status, 'draft')))
      .orderBy(desc(pitches.createdAt)),
    db.query.subscriptions.findFirst({
      where: eq(subscriptions.clientProfileId, id),
      orderBy: [desc(subscriptions.createdAt)],
    }),
  ]);

  const name = client.company || client.fullName || 'this client';
  const remaining = sub ? Math.max(0, sub.monthlyPitchQuota - sub.pitchesUsedThisPeriod) : null;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/va/clients/${id}`} className="text-sm text-muted-foreground hover:underline">
          ← Back to workspace
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl">Review pitches</h1>
            <p className="text-sm text-muted-foreground">
              {name} · {drafts.length} draft{drafts.length === 1 ? '' : 's'} awaiting approval
              {remaining !== null ? ` · ${remaining} sends left this period` : ''}
            </p>
          </div>
        </div>
        {!client.unipileAccountId && (
          <p className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            This client&apos;s sending inbox is not connected. Approved pitches will queue but
            cannot send until they connect it.
          </p>
        )}
      </div>

      <ReviewList
        clientProfileId={id}
        drafts={drafts.map((d) => ({
          id: d.id,
          step: d.step,
          subject: d.subject ?? '',
          body: d.body ?? '',
          angleUsed: d.angleUsed,
          podcastTitle: d.podcastTitle,
          hostName: d.hostName,
          hasHostEmail: Boolean(d.hostEmails && d.hostEmails.length > 0),
        }))}
      />
    </div>
  );
}
