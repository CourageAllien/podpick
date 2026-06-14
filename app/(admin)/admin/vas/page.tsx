import { desc, eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { users, clientProfiles } from '@/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreateVaForm } from './create-va-form';
import { VaActiveToggle } from './va-active-toggle';

export const dynamic = 'force-dynamic';

export default async function AdminVasPage() {
  const vas = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      isActive: users.isActive,
      lastLoginAt: users.lastLoginAt,
      assignedCount: sql<number>`(
        select count(*)::int from ${clientProfiles}
        where ${clientProfiles.assignedVaId} = ${users.id}
      )`,
    })
    .from(users)
    .where(eq(users.role, 'va'))
    .orderBy(desc(users.createdAt));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-3xl">Virtual Assistants</h1>
          <span className="text-sm text-muted-foreground">{vas.length} total</span>
        </div>

        {vas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No VAs yet. Add one using the form.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {vas.map((va) => (
              <Card key={va.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{va.fullName || va.email}</span>
                      <Badge variant={va.isActive ? 'success' : 'muted'}>
                        {va.isActive ? 'active' : 'inactive'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{va.email}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {va.assignedCount} client{va.assignedCount === 1 ? '' : 's'} assigned
                    </div>
                  </div>
                  <VaActiveToggle vaId={va.id} isActive={va.isActive} />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-lg">Add a VA</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateVaForm />
        </CardContent>
      </Card>
    </div>
  );
}
