import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { clientProfiles, users } from '@/db/schema';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AssignVaSelect } from './assign-select';

export const dynamic = 'force-dynamic';

function fmtDate(d: Date | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' });
}

export default async function AdminClientsPage() {
  const [clients, vas] = await Promise.all([
    db
      .select({
        id: clientProfiles.id,
        company: clientProfiles.company,
        slug: clientProfiles.slug,
        status: clientProfiles.status,
        intakeCompletedAt: clientProfiles.intakeCompletedAt,
        assignedVaId: clientProfiles.assignedVaId,
        createdAt: clientProfiles.createdAt,
        userName: users.fullName,
        userEmail: users.email,
      })
      .from(clientProfiles)
      .leftJoin(users, eq(clientProfiles.userId, users.id))
      .orderBy(desc(clientProfiles.createdAt)),
    db
      .select({ id: users.id, fullName: users.fullName, email: users.email })
      .from(users)
      .where(eq(users.role, 'va')),
  ]);

  const vaOptions = vas.map((v) => ({ id: v.id, label: v.fullName || v.email }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Clients</h1>
        <span className="text-sm text-muted-foreground">{clients.length} total</span>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No clients yet. They appear here after the first checkout completes.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Client</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Intake</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3 font-medium">Assigned VA</th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-3">
                        <div className="font-medium">{c.company || c.userName || 'Unnamed'}</div>
                        <div className="text-xs text-muted-foreground">{c.userEmail}</div>
                      </td>
                      <td className="px-4 py-3">
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
                      </td>
                      <td className="px-4 py-3">
                        {c.intakeCompletedAt ? (
                          <Badge variant="success">Done</Badge>
                        ) : (
                          <Badge variant="muted">Pending</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{fmtDate(c.createdAt)}</td>
                      <td className="px-4 py-3">
                        <AssignVaSelect
                          clientProfileId={c.id}
                          current={c.assignedVaId}
                          options={vaOptions}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/m/${c.slug}`}
                          target="_blank"
                          className="text-xs text-terracotta underline"
                        >
                          Media page
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
