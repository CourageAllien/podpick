import Link from 'next/link';
import { sql, eq } from 'drizzle-orm';
import { db } from '@/db';
import { clientProfiles, subscriptions, pitches, users, positiveReplyLifecycle } from '@/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

// Monthly price per tier (USD) — used for a rough MRR estimate from active subs.
const TIER_PRICE: Record<string, number> = { standard: 99, pro: 199 };

export default async function AdminOverviewPage() {
  const [
    clientRows,
    subRows,
    pitchAgg,
    vaRows,
    hotLeadAgg,
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
    db.select({ id: users.id }).from(users).where(eq(users.role, 'va')),
    db
      .select({ stage: positiveReplyLifecycle.stage })
      .from(positiveReplyLifecycle),
  ]);

  const vaCount = vaRows.length;

  const clientsByStatus = clientRows.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  const mrr = subRows
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + (TIER_PRICE[s.tier] ?? 0), 0);
  const trialingSubs = subRows.filter((s) => s.status === 'trialing').length;

  const sent = pitchAgg[0]?.sent ?? 0;
  const replied = pitchAgg[0]?.replied ?? 0;
  const replyRate = sent > 0 ? Math.round((replied / sent) * 100) : 0;

  const booked = hotLeadAgg.filter((l) =>
    ['booked', 'recorded', 'live'].includes(l.stage)
  ).length;

  const kpis = [
    { label: 'MRR (est.)', value: `$${mrr.toLocaleString()}` },
    { label: 'Total clients', value: clientRows.length },
    { label: 'Active subs', value: subRows.filter((s) => s.status === 'active').length },
    { label: 'Trials', value: trialingSubs },
    { label: 'Pitches sent', value: sent },
    { label: 'Reply rate', value: `${replyRate}%` },
    { label: 'Booked', value: booked },
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
    </div>
  );
}
