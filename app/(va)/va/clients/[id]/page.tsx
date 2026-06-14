import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { desc, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import {
  clientProfiles,
  users,
  subscriptions,
  pitches,
  podcasts,
  positiveReplyLifecycle,
} from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

const DRAFT_STATUSES = ['draft', 'queued', 'scheduled'];

function fmtDate(d: Date | string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default async function VaClientWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await getCurrentUser();
  if (!me) redirect('/auth/signin');

  const profile = await db
    .select({
      id: clientProfiles.id,
      company: clientProfiles.company,
      website: clientProfiles.website,
      slug: clientProfiles.slug,
      status: clientProfiles.status,
      assignedVaId: clientProfiles.assignedVaId,
      oneLineBio: clientProfiles.oneLineBio,
      longBio: clientProfiles.longBio,
      topics: clientProfiles.topics,
      angles: clientProfiles.angles,
      targetAudience: clientProfiles.targetAudience,
      goals: clientProfiles.goals,
      revenueRange: clientProfiles.revenueRange,
      yearsInBusiness: clientProfiles.yearsInBusiness,
      hasBeenOnPodcast: clientProfiles.hasBeenOnPodcast,
      intakeCompletedAt: clientProfiles.intakeCompletedAt,
      bookingLink: clientProfiles.bookingLink,
      unipileAccountId: clientProfiles.unipileAccountId,
      userName: users.fullName,
      userEmail: users.email,
    })
    .from(clientProfiles)
    .leftJoin(users, eq(clientProfiles.userId, users.id))
    .where(eq(clientProfiles.id, id))
    .limit(1);

  const client = profile[0];
  if (!client) notFound();

  // Authorization: admins see all; VAs only their own assignments.
  if (me.role === 'va' && client.assignedVaId !== me.id) {
    redirect('/va');
  }

  const [sub, pitchRows, leads] = await Promise.all([
    db.query.subscriptions.findFirst({
      where: eq(subscriptions.clientProfileId, client.id),
    }),
    db
      .select({
        id: pitches.id,
        podcastId: pitches.podcastId,
        status: pitches.status,
        step: pitches.step,
        subject: pitches.subject,
        sentAt: pitches.sentAt,
      })
      .from(pitches)
      .where(eq(pitches.clientProfileId, client.id))
      .orderBy(desc(pitches.createdAt)),
    db
      .select({
        id: positiveReplyLifecycle.id,
        stage: positiveReplyLifecycle.stage,
        bookedFor: positiveReplyLifecycle.bookedFor,
      })
      .from(positiveReplyLifecycle)
      .where(eq(positiveReplyLifecycle.clientProfileId, client.id))
      .orderBy(desc(positiveReplyLifecycle.updatedAt)),
  ]);

  // Resolve podcast titles (no relations defined, so map manually).
  const podcastIds = [...new Set(pitchRows.map((p) => p.podcastId))];
  const podcastRows = podcastIds.length
    ? await db
        .select({ id: podcasts.id, title: podcasts.title })
        .from(podcasts)
        .where(inArray(podcasts.id, podcastIds))
    : [];
  const titleById = new Map(podcastRows.map((p) => [p.id, p.title]));

  const drafts = pitchRows.filter((p) => DRAFT_STATUSES.includes(p.status));
  const sent = pitchRows.filter((p) => p.status === 'sent' || p.status === 'replied');
  const activeLeads = leads.filter((l) =>
    ['new', 'va_drafted', 'client_notified', 'response_sent', 'in_conversation'].includes(l.stage)
  );

  const angles = (client.angles ?? []) as Array<{ title: string; description: string }>;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/va" className="text-sm text-muted-foreground hover:underline">
          ← Back to clients
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl">{client.company || client.userName || 'Client'}</h1>
            <p className="text-sm text-muted-foreground">{client.userEmail}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={client.status === 'active' ? 'success' : 'secondary'}>
              {client.status}
            </Badge>
            <Badge variant={client.unipileAccountId ? 'success' : 'muted'}>
              {client.unipileAccountId ? 'Inbox connected' : 'Inbox not connected'}
            </Badge>
          </div>
        </div>
        <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">Read-only view</p>
      </div>

      {/* Intake summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Intake summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {!client.intakeCompletedAt && (
            <Badge variant="muted">Intake not completed yet</Badge>
          )}
          {client.oneLineBio && <p className="font-medium">{client.oneLineBio}</p>}
          {client.longBio && <p className="text-muted-foreground">{client.longBio}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Revenue range" value={client.revenueRange} />
            <Field
              label="Years in business"
              value={client.yearsInBusiness != null ? String(client.yearsInBusiness) : null}
            />
            <Field
              label="Been on a podcast before"
              value={client.hasBeenOnPodcast ? 'Yes' : 'No'}
            />
            <Field label="Website" value={client.website} />
            <Field label="Target audience" value={client.targetAudience} />
            <Field label="Goals" value={client.goals} />
          </div>

          {client.topics && client.topics.length > 0 && (
            <div>
              <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Topics</p>
              <div className="flex flex-wrap gap-2">
                {client.topics.map((t) => (
                  <Badge key={t} variant="secondary">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {angles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Angles</p>
              {angles.map((a, i) => (
                <div key={i} className="rounded-md border p-3">
                  <p className="font-medium">{a.title}</p>
                  <p className="text-muted-foreground">{a.description}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-4 pt-2 text-xs">
            <a
              className="text-terracotta underline"
              href={`/m/${client.slug}`}
              target="_blank"
              rel="noreferrer"
            >
              Media page
            </a>
            {client.bookingLink && (
              <a
                className="text-terracotta underline"
                href={client.bookingLink}
                target="_blank"
                rel="noreferrer"
              >
                Booking link
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quota */}
      {sub && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Plan</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>
              <span className="font-medium capitalize">{sub.tier}</span> ·{' '}
              {sub.pitchesUsedThisPeriod}/{sub.monthlyPitchQuota} pitches used this period
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pitches */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PitchList
          title="Drafts & queued"
          rows={drafts}
          titleById={titleById}
          empty="No drafts. Generate pitches from the agent chat (coming in a later week)."
        />
        <PitchList
          title="Sent & replied"
          rows={sent}
          titleById={titleById}
          empty="Nothing sent yet."
        />
      </div>

      {/* Hot leads */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Hot leads</CardTitle>
        </CardHeader>
        <CardContent>
          {activeLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active positive replies.</p>
          ) : (
            <div className="space-y-2">
              {activeLeads.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <Badge variant="default">{l.stage}</Badge>
                  {l.bookedFor && (
                    <span className="text-xs text-muted-foreground">
                      Booked {fmtDate(l.bookedFor)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p>{value}</p>
    </div>
  );
}

function PitchList({
  title,
  rows,
  titleById,
  empty,
}: {
  title: string;
  rows: Array<{
    id: string;
    podcastId: string;
    status: string;
    step: string;
    subject: string | null;
    sentAt: Date | string | null;
  }>;
  titleById: Map<string, string>;
  empty: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {title} <span className="text-sm text-muted-foreground">({rows.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <div className="space-y-2">
            {rows.map((p) => (
              <div key={p.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {titleById.get(p.podcastId) ?? 'Unknown podcast'}
                  </span>
                  <Badge variant="secondary">{p.step === 'step2' ? 'S2' : 'S1'}</Badge>
                </div>
                {p.subject && <p className="mt-1 text-sm text-muted-foreground">{p.subject}</p>}
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{p.status}</Badge>
                  {p.sentAt && <span>Sent {fmtDate(p.sentAt)}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
