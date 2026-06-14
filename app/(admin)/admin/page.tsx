import Link from 'next/link';
import { sql, eq, gte } from 'drizzle-orm';
import { db } from '@/db';
import {
  clientProfiles,
  subscriptions,
  pitches,
  users,
  positiveReplyLifecycle,
  aiGenerations,
} from '@/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

// Monthly price per tier (USD) — used for a rough MRR estimate from active subs.
const TIER_PRICE: Record<string, number> = { standard: 99, pro: 199 };

// Positive-reply funnel ordered from first touch to live episode.
const FUNNEL_STAGES = [
  'new',
  'va_drafted',
  'client_notified',
  'response_sent',
  'in_conversation',
  'booked',
  'recorded',
  'live',
] as const;

const STAGE_LABEL: Record<string, string> = {
  new: 'New',
  va_drafted: 'VA drafted',
  client_notified: 'Client notified',
  response_sent: 'Response sent',
  in_conversation: 'In conversation',
  booked: 'Booked',
  recorded: 'Recorded',
  live: 'Live',
  dropped: 'Dropped',
};

export default async function AdminOverviewPage() {
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    clientRows,
    subRows,
    pitchAgg,
    vaRows,
    funnelRows,
    agentCostAgg,
    perVaRows,
    churn30Agg,
  ] = await Promise.all([
    db.select({ status: clientProfiles.status }).from(clientProfiles),
    db
      .select({ tier: subscriptions.tier, status: subscriptions.status })
      .from(subscriptions),
    db
      .select({
        sent: sql<number>`count(*) filter (where ${pitches.status} = 'sent' or ${pitches.status} = 'replied')::int`,
        replied: sql<number>`count(*) filter (where ${pitches.status} = 'replied')::int`,
      })
      .from(pitches),
    db
      .select({ id: users.id, name: users.fullName, email: users.email })
      .from(users)
      .where(eq(users.role, 'va')),
    db
      .select({ stage: positiveReplyLifecycle.stage })
      .from(positiveReplyLifecycle),
    // Agent usage cost (this calendar month, in cents)
    db
      .select({
        cents: sql<number>`coalesce(sum(${aiGenerations.costCents}), 0)::int`,
        generations: sql<number>`count(*)::int`,
      })
      .from(aiGenerations)
      .where(gte(aiGenerations.createdAt, startOfMonth)),
    // Per-VA performance — clients, pitches sent, replies, bookings
    db
      .select({
        vaId: clientProfiles.assignedVaId,
        clients: sql<number>`count(distinct ${clientProfiles.id})::int`,
        sent: sql<number>`count(*) filter (where ${pitches.status} = 'sent' or ${pitches.status} = 'replied')::int`,
        replied: sql<number>`count(*) filter (where ${pitches.status} = 'replied')::int`,
      })
      .from(clientProfiles)
      .leftJoin(pitches, eq(pitches.clientProfileId, clientProfiles.id))
      .groupBy(clientProfiles.assignedVaId),
    // Subs canceled in the last 30 days (churn numerator)
    db
      .select({ value: sql<number>`count(*)::int` })
      .from(subscriptions)
      .where(
        sql`${subscriptions.status} = 'canceled' and ${subscriptions.canceledAt} >= ${thirtyDaysAgo.toISOString()}`
      ),
  ]);

  const vaCount = vaRows.length;

  const clientsByStatus = clientRows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  const activeSubs = subRows.filter((s) => s.status === 'active').length;
  const trialingSubs = subRows.filter((s) => s.status === 'trialing').length;
  const pastDueSubs = subRows.filter((s) => s.status === 'past_due').length;
  const canceledSubs = subRows.filter((s) => s.status === 'canceled').length;

  const mrr = subRows
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + (TIER_PRICE[s.tier] ?? 0), 0);

  const sent = pitchAgg[0]?.sent ?? 0;
  const replied = pitchAgg[0]?.replied ?? 0;
  const replyRate = sent > 0 ? Math.round((replied / sent) * 100) : 0;

  // Churn rate = subs canceled in last 30d / (active + canceled-in-30d at risk base)
  const churned30 = churn30Agg[0]?.value ?? 0;
  const churnBase = activeSubs + churned30;
  const churnRate = churnBase > 0 ? Math.round((churned30 / churnBase) * 100) : 0;

  const agentCents = agentCostAgg[0]?.cents ?? 0;
  const agentGenerations = agentCostAgg[0]?.generations ?? 0;
  const agentCostUsd = (agentCents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const funnel = FUNNEL_STAGES.map((stage) => ({
    stage,
    count: funnelRows.filter((r) => r.stage === stage).length,
  }));
  const dropped = funnelRows.filter((r) => r.stage === 'dropped').length;
  const booked = funnelRows.filter((l) =>
    ['booked', 'recorded', 'live'].includes(l.stage)
  ).length;

  // Per-VA: join the aggregate rows to VA names. Rows with null vaId = unassigned.
  const vaById = new Map(vaRows.map((v) => [v.id, v]));
  const perVa = perVaRows
    .filter((r) => r.vaId !== null)
    .map((r) => {
      const va = vaById.get(r.vaId!);
      return {
        id: r.vaId!,
        name: va?.name || va?.email || 'Unknown VA',
        clients: r.clients,
        sent: r.sent,
        replied: r.replied,
        replyRate: r.sent > 0 ? Math.round((r.replied / r.sent) * 100) : 0,
      };
    })
    .sort((a, b) => b.sent - a.sent);
  const unassigned = perVaRows.find((r) => r.vaId === null);

  const kpis = [
    { label: 'MRR (est.)', value: `$${mrr.toLocaleString()}` },
    { label: 'Active subs', value: activeSubs },
    { label: 'Trials', value: trialingSubs },
    { label: 'Churn (30d)', value: `${churnRate}%` },
    { label: 'Reply rate', value: `${replyRate}%` },
    { label: 'Booked', value: booked },
    { label: 'Agent cost (mo.)', value: `$${agentCostUsd}` },
    { label: 'VAs', value: vaCount },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Overview</h1>
        <Link href="/admin/clients" className="text-sm text-terracotta underline">
          View all clients →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{k.label}</p>
              <p className="mt-1 font-serif text-3xl">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {(pastDueSubs > 0 || churned30 > 0) && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="flex flex-wrap items-center gap-4 pt-6 text-sm">
            {pastDueSubs > 0 && (
              <span>
                <span className="font-semibold">{pastDueSubs}</span> subscription
                {pastDueSubs === 1 ? '' : 's'} past due (dunning in progress)
              </span>
            )}
            {churned30 > 0 && (
              <span>
                <span className="font-semibold">{churned30}</span> canceled in the last 30 days
              </span>
            )}
            <Link href="/admin/clients" className="text-terracotta underline">
              Review billing →
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Clients by status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 text-sm">
            {(['trialing', 'active', 'paused', 'canceled'] as const).map((s) => (
              <div key={s} className="flex items-center gap-2 rounded-md border px-3 py-2">
                <Badge variant={s === 'active' ? 'success' : s === 'canceled' ? 'muted' : 'secondary'}>
                  {s}
                </Badge>
                <span className="font-medium">{clientsByStatus[s] ?? 0}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Agent usage (this month)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              Cost: <span className="font-medium">${agentCostUsd}</span> across{' '}
              {agentGenerations.toLocaleString()} generations
            </p>
            <p className="text-muted-foreground">
              Past-due: {pastDueSubs} · Canceled (all time): {canceledSubs}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Positive-reply funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 text-sm">
            {funnel.map((f) => (
              <div key={f.stage} className="flex items-center gap-2 rounded-md border px-3 py-2">
                <span className="text-muted-foreground">{STAGE_LABEL[f.stage]}</span>
                <span className="font-serif text-lg">{f.count}</span>
              </div>
            ))}
            {dropped > 0 && (
              <div className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2">
                <span className="text-muted-foreground">Dropped</span>
                <span className="font-serif text-lg">{dropped}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Per-VA performance</CardTitle>
        </CardHeader>
        <CardContent>
          {perVa.length === 0 ? (
            <p className="text-sm text-muted-foreground">No VAs with assigned clients yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">VA</th>
                    <th className="py-2 pr-4 font-medium">Clients</th>
                    <th className="py-2 pr-4 font-medium">Sent</th>
                    <th className="py-2 pr-4 font-medium">Replies</th>
                    <th className="py-2 font-medium">Reply rate</th>
                  </tr>
                </thead>
                <tbody>
                  {perVa.map((v) => (
                    <tr key={v.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{v.name}</td>
                      <td className="py-2 pr-4">{v.clients}</td>
                      <td className="py-2 pr-4">{v.sent}</td>
                      <td className="py-2 pr-4">{v.replied}</td>
                      <td className="py-2">{v.replyRate}%</td>
                    </tr>
                  ))}
                  {unassigned && unassigned.clients > 0 && (
                    <tr className="border-b text-muted-foreground last:border-0">
                      <td className="py-2 pr-4 italic">Unassigned</td>
                      <td className="py-2 pr-4">{unassigned.clients}</td>
                      <td className="py-2 pr-4">{unassigned.sent}</td>
                      <td className="py-2 pr-4">{unassigned.replied}</td>
                      <td className="py-2">
                        {unassigned.sent > 0
                          ? Math.round((unassigned.replied / unassigned.sent) * 100)
                          : 0}
                        %
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
