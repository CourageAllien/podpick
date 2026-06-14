import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import {
  clientProfiles,
  users,
  positiveReplyLifecycle,
  responses,
  pitches,
  podcasts,
} from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { LeadsList, type LeadItem } from './leads-list';

export const dynamic = 'force-dynamic';

export default async function VaLeadsPage({
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
      fullName: users.fullName,
    })
    .from(clientProfiles)
    .leftJoin(users, eq(clientProfiles.userId, users.id))
    .where(eq(clientProfiles.id, id))
    .limit(1);

  const client = rows[0];
  if (!client) notFound();
  if (me.role === 'va' && client.assignedVaId !== me.id) redirect('/va');

  const lifecycles = await db
    .select()
    .from(positiveReplyLifecycle)
    .where(eq(positiveReplyLifecycle.clientProfileId, id))
    .orderBy(desc(positiveReplyLifecycle.updatedAt));

  const responseIds = lifecycles.map((l) => l.responseId);
  const pitchIds = lifecycles.map((l) => l.pitchId);

  const [responseRows, pitchRows] = await Promise.all([
    responseIds.length
      ? db.select().from(responses).where(inArray(responses.id, responseIds))
      : Promise.resolve([]),
    pitchIds.length
      ? db
          .select({ id: pitches.id, podcastId: pitches.podcastId, step: pitches.step })
          .from(pitches)
          .where(inArray(pitches.id, pitchIds))
      : Promise.resolve([]),
  ]);

  const podcastIds = [...new Set(pitchRows.map((p) => p.podcastId))];
  const podcastRows = podcastIds.length
    ? await db
        .select({ id: podcasts.id, title: podcasts.title, hostName: podcasts.hostName })
        .from(podcasts)
        .where(inArray(podcasts.id, podcastIds))
    : [];

  const responseById = new Map(responseRows.map((r) => [r.id, r]));
  const pitchById = new Map(pitchRows.map((p) => [p.id, p]));
  const podcastById = new Map(podcastRows.map((p) => [p.id, p]));

  const items: LeadItem[] = lifecycles.map((l) => {
    const r = responseById.get(l.responseId);
    const p = pitchById.get(l.pitchId);
    const pod = p ? podcastById.get(p.podcastId) : undefined;
    return {
      lifecycleId: l.id,
      stage: l.stage,
      podcastTitle: pod?.title ?? 'Unknown podcast',
      hostName: pod?.hostName ?? null,
      classification: r?.classification ?? 'pending',
      hostReply: r?.body ?? null,
      hostSubject: r?.subject ?? null,
      fromEmail: r?.fromEmail ?? null,
      vaDraftResponse: l.vaDraftResponse,
      clientNotifiedAt: l.clientNotifiedAt ? new Date(l.clientNotifiedAt).toISOString() : null,
      clientSentAt: l.clientSentAt ? new Date(l.clientSentAt).toISOString() : null,
      bookedFor: l.bookedFor ? new Date(l.bookedFor).toISOString() : null,
      receivedAt: r?.receivedAt ? new Date(r.receivedAt).toISOString() : null,
    };
  });

  const name = client.company || client.fullName || 'this client';
  const active = items.filter((i) => !['dropped', 'live'].includes(i.stage)).length;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/va/clients/${id}`} className="text-sm text-muted-foreground hover:underline">
          ← Back to workspace
        </Link>
        <h1 className="mt-2 font-serif text-3xl">Hot leads</h1>
        <p className="text-sm text-muted-foreground">
          {name} · {active} active positive {active === 1 ? 'reply' : 'replies'}. Draft the client&apos;s
          response, then notify them to review and send from their own inbox.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No positive replies yet. When a host replies with interest, it is classified and lands here
          automatically.
        </p>
      ) : (
        <LeadsList items={items} />
      )}
    </div>
  );
}
