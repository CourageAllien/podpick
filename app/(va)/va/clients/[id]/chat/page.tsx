import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { clientProfiles, users } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { ChatPanel } from './chat-panel';

export const dynamic = 'force-dynamic';

export default async function VaClientChatPage({
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

  const name = client.company || client.fullName || 'this client';

  return (
    <div className="space-y-4">
      <div>
        <Link href={`/va/clients/${id}`} className="text-sm text-muted-foreground hover:underline">
          ← Back to workspace
        </Link>
        <h1 className="mt-2 font-serif text-3xl">Research assistant</h1>
        <p className="text-sm text-muted-foreground">
          Working on <span className="font-medium">{name}</span>. Read-only and discovery tools only.
        </p>
      </div>
      <ChatPanel clientProfileId={client.id} clientName={name} />
    </div>
  );
}
