import Link from 'next/link';
import { redirect } from 'next/navigation';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import { clientProfiles, users, pitches, positiveReplyLifecycle } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function VaHomePage() {
  const me = await getCurrentUser();
  if (!me) redirect('/auth/signin?redirect=/va');

  // Admins viewing /va see every client; VAs see only their assignments.
  const assignment =
    me.role === 'admin' ? undefined : eq(clientProfiles.assignedVaId, me.id);

  const clients = await db
    .select({
      id: clientProfiles.id,
      company: clientProfiles.company,
      slug: clientProfiles.slug,
      status: clientProfiles.status,
      intakeCompletedAt: clientProfiles.intakeCompletedAt,
      userName: users.fullName,
      userEmail: users.email,
    })
    .from(clientProfiles)
    .leftJoin(users, eq(clientProfiles.userId, users.id))
    .where(assignment as never)
    .orderBy(clientProfiles.createdAt);

  const ids = clients.map((c) => c.id);

  // Per-client mini-stats in two grouped queries (avoids N+1).
  const [pitchStats, leadStats] = await Promise.all([
    ids.length
      ? db
          .select({
            clientProfileId: pitches.clientProfileId,
            drafts: sql<number>`count(*) filter (where ${pitches.status} in ('draft','queued','scheduled'))::int`,
            sent: sql<number>`count(*) filter (where ${pitches.status} in ('sent','replied'))::int`,
          })
          .from(pitches)
          .where(inArray(pitches.clientProfileId, ids))
          .groupBy(pitches.clientProfileId)
      : Promise.resolve([]),
    ids.length
      ? db
          .select({
            clientProfileId: positiveReplyLifecycle.clientProfileId,
            hot: sql<number>`count(*) filter (where ${positiveReplyLifecycle.stage} in ('new','va_drafted','client_notified'))::int`,
          })
          .from(positiveReplyLifecycle)
          .where(inArray(positiveReplyLifecycle.clientProfileId, ids))
          .groupBy(positiveReplyLifecycle.clientProfileId)
      : Promise.resolve([]),
  ]);

  const pitchByClient = new Map(pitchStats.map((p) => [p.clientProfileId, p]));
  const leadByClient = new Map(leadStats.map((l) => [l.clientProfileId, l]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">
          {me.role === 'admin' ? 'All clients' : 'Your clients'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {clients.length} client{clients.length === 1 ? '' : 's'} assigned to you.
        </p>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No clients assigned yet. An admin assigns clients to you from the admin panel.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => {
            const p = pitchByClient.get(c.id);
            const l = leadByClient.get(c.id);
            const hot = l?.hot ?? 0;
            return (
              <Link key={c.id} href={`/va/clients/${c.id}`}>
                <Card className="h-full transition-colors hover:border-terracotta-300">
                  <CardContent className="space-y-3 pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{c.company || c.userName || 'Unnamed'}</div>
                        <div className="text-xs text-muted-foreground">{c.userEmail}</div>
                      </div>
                      <Badge
                        variant={
                          c.status === 'active'
                            ? 'success'
                            : c.status === 'canceled'
                              ? 'muted'
                              : 'secondary'
                        }
                      >
                        {c.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {!c.intakeCompletedAt && <Badge variant="muted">Intake pending</Badge>}
                      <Badge variant="outline">{p?.drafts ?? 0} drafts</Badge>
                      <Badge variant="outline">{p?.sent ?? 0} sent</Badge>
                      {hot > 0 && <Badge variant="default">{hot} hot</Badge>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
