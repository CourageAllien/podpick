import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import {
  clientProfiles,
  users,
  pitches,
  podcastSuggestions,
  podcasts,
  hostPersonalContexts,
} from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { HostContextList } from './host-context-list';

export const dynamic = 'force-dynamic';

const SILENT_DAYS = 10;

export default async function VaHostsPage({
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

  // Podcasts relevant to this client: anything pitched or suggested.
  const [pitchedRows, suggestedRows] = await Promise.all([
    db
      .select({
        podcastId: pitches.podcastId,
        step: pitches.step,
        status: pitches.status,
        sentAt: pitches.sentAt,
      })
      .from(pitches)
      .where(eq(pitches.clientProfileId, id)),
    db
      .select({ podcastId: podcastSuggestions.podcastId })
      .from(podcastSuggestions)
      .where(eq(podcastSuggestions.clientProfileId, id)),
  ]);

  const podcastIds = [
    ...new Set([
      ...pitchedRows.map((p) => p.podcastId),
      ...suggestedRows.map((s) => s.podcastId),
    ]),
  ];

  if (podcastIds.length === 0) {
    return (
      <Shell clientId={id} name={client.company || client.fullName || 'this client'}>
        <p className="text-sm text-muted-foreground">
          No podcasts in play for this client yet. Once you discover and pitch shows from the
          research assistant, their hosts appear here for Step 2 context.
        </p>
      </Shell>
    );
  }

  const [podcastRows, contextRows] = await Promise.all([
    db
      .select({
        id: podcasts.id,
        title: podcasts.title,
        hostName: podcasts.hostName,
      })
      .from(podcasts)
      .where(inArray(podcasts.id, podcastIds)),
    db
      .select()
      .from(hostPersonalContexts)
      .where(inArray(hostPersonalContexts.podcastId, podcastIds)),
  ]);

  const contextByPodcast = new Map(contextRows.map((c) => [c.podcastId, c]));

  // Mark which hosts are "silent Step 1" so the VA knows where Step 2 context pays off.
  const cutoff = Date.now() - SILENT_DAYS * 24 * 60 * 60 * 1000;
  const silentStep1 = new Set(
    pitchedRows
      .filter(
        (p) =>
          p.step === 'step1' &&
          p.status === 'sent' &&
          p.sentAt &&
          new Date(p.sentAt).getTime() < cutoff
      )
      .map((p) => p.podcastId)
  );
  const hasStep2 = new Set(
    pitchedRows.filter((p) => p.step === 'step2').map((p) => p.podcastId)
  );

  const items = podcastRows
    .map((p) => {
      const ctx = contextByPodcast.get(p.id);
      return {
        podcastId: p.id,
        podcastTitle: p.title,
        hostName: ctx?.hostName ?? p.hostName ?? '',
        linkedinUrl: ctx?.linkedinUrl ?? '',
        linkedinSummary: ctx?.linkedinSummary ?? '',
        substackUrl: ctx?.substackUrl ?? '',
        personalJourney: ctx?.personalJourney ?? '',
        recentPosts: ctx?.recentPosts ?? [],
        interviewQuotes: ctx?.interviewQuotes ?? [],
        hasSufficientContext: ctx?.hasSufficientContext ?? false,
        isSilentStep1: silentStep1.has(p.id),
        alreadyStep2: hasStep2.has(p.id),
        lastRefreshedAt: ctx?.lastRefreshedAt ? new Date(ctx.lastRefreshedAt).toISOString() : null,
      };
    })
    // Surface the ones that matter most: silent Step 1 needing context first.
    .sort((a, b) => {
      const aPriority = a.isSilentStep1 && !a.hasSufficientContext ? 0 : a.hasSufficientContext ? 2 : 1;
      const bPriority = b.isSilentStep1 && !b.hasSufficientContext ? 0 : b.hasSufficientContext ? 2 : 1;
      return aPriority - bPriority;
    });

  return (
    <Shell clientId={id} name={client.company || client.fullName || 'this client'}>
      <HostContextList clientProfileId={id} items={items} />
    </Shell>
  );
}

function Shell({
  clientId,
  name,
  children,
}: {
  clientId: string;
  name: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/va/clients/${clientId}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to workspace
        </Link>
        <h1 className="mt-2 font-serif text-3xl">Host context</h1>
        <p className="text-sm text-muted-foreground">
          {name} · personal material that powers Step 2 (host-based) pitches. Add real posts,
          quotes, and journey notes. Mark a host &ldquo;sufficient&rdquo; only when there is enough
          honest material to write from.
        </p>
      </div>
      {children}
    </div>
  );
}
