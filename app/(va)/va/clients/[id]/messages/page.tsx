import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { clientProfiles, users, conversations } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import {
  loadThreadMessages,
  sendVaMessage,
  markVaRead,
  type ThreadMessage,
} from '@/app/actions/messages';
import { MessageThread } from '@/components/message-thread';

export const dynamic = 'force-dynamic';

export default async function VaMessagesPage({
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

  const conversation = await db.query.conversations.findFirst({
    where: eq(conversations.clientProfileId, id),
  });
  const threadMessages: ThreadMessage[] = conversation
    ? await loadThreadMessages(conversation.id)
    : [];

  const name = client.company || client.fullName || 'this client';
  const sendBound = sendVaMessage.bind(null, id);
  const markReadBound = markVaRead.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href={`/va/clients/${id}`} className="text-sm text-muted-foreground hover:underline">
          ← Back to workspace
        </Link>
        <h1 className="mt-2 font-serif text-3xl">Messages</h1>
        <p className="text-sm text-muted-foreground">
          Async thread with {name}. This is separate from the research assistant. Keep it to client
          updates, questions, and approvals.
        </p>
      </div>

      <MessageThread
        meId={me.id}
        initialMessages={threadMessages}
        send={sendBound}
        markRead={markReadBound}
        emptyHint={`No messages with ${name} yet. Send the first update.`}
      />
    </div>
  );
}
