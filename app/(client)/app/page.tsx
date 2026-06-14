import { redirect } from 'next/navigation';
import { eq, inArray, desc } from 'drizzle-orm';
import { db } from '@/db';
import {
  pitches as pitchesTable,
  podcasts as podcastsTable,
  positiveReplyLifecycle,
  subscriptions as subscriptionsTable,
} from '@/db/schema';
import { getCurrentUser, getCurrentClientProfile } from '@/lib/auth';
import { Dashboard, type DashboardPitch, type DashboardLead } from './dashboard';

export default async function ClientDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/signin?redirect=/app');

  const profile = await getCurrentClientProfile();
  if (!profile) redirect('/auth/checkout?tier=standard');
  if (!profile.intakeCompletedAt) redirect('/app/intake');

  const [subscription, rawPitches, leads] = await Promise.all([
    db.query.subscriptions.findFirst({
      where: eq(subscriptionsTable.clientProfileId, profile.id),
    }),
    db.query.pitches.findMany({
      where: eq(pitchesTable.clientProfileId, profile.id),
      orderBy: desc(pitchesTable.createdAt),
      limit: 100,
    }),
    db.query.positiveReplyLifecycle.findMany({
      where: eq(positiveReplyLifecycle.clientProfileId, profile.id),
      orderBy: desc(positiveReplyLifecycle.updatedAt),
    }),
  ]);

  // Resolve podcast titles without relational joins
  const podcastIds = Array.from(new Set(rawPitches.map((p) => p.podcastId)));
  const podcastRows = podcastIds.length
    ? await db.query.podcasts.findMany({ where: inArray(podcastsTable.id, podcastIds) })
    : [];
  const podcastById = new Map(podcastRows.map((p) => [p.id, p]));

  const pitches: DashboardPitch[] = rawPitches.map((p) => {
    const pod = podcastById.get(p.podcastId);
    return {
      id: p.id,
      podcastTitle: pod?.title || 'Podcast',
      hostName: pod?.hostName || null,
      status: p.status,
      step: p.step,
      subject: p.subject,
      body: p.body,
      sentAt: p.sentAt ? p.sentAt.toISOString() : null,
    };
  });

  const hotLeads: DashboardLead[] = leads.map((l) => ({
    id: l.id,
    stage: l.stage,
    vaDraftResponse: l.vaDraftResponse,
    bookedFor: l.bookedFor ? l.bookedFor.toISOString() : null,
  }));

  return (
    <Dashboard
      name={user.fullName || profile.company || 'there'}
      slug={profile.slug}
      status={profile.status}
      trialEndsAt={profile.trialEndsAt ? profile.trialEndsAt.toISOString() : null}
      tier={subscription?.tier ?? null}
      quota={subscription?.monthlyPitchQuota ?? null}
      used={subscription?.pitchesUsedThisPeriod ?? 0}
      unipileConnected={!!profile.unipileAccountId}
      pitches={pitches}
      hotLeads={hotLeads}
    />
  );
}
