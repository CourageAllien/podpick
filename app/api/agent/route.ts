import type Anthropic from '@anthropic-ai/sdk';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { clientProfiles } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';
import { runAgentTurn } from '@/lib/agent/orchestrator';
import type { AgentContext } from '@/lib/agent/types';

export const runtime = 'nodejs';
export const maxDuration = 120;

type IncomingMessage = { role: 'user' | 'assistant'; content: string };

/**
 * Agent chat endpoint. Streams Server-Sent Events: text deltas, tool-call and
 * tool-result activity, and a terminal done/error. VAs may only chat about
 * clients assigned to them; admins may chat about any client.
 */
export async function POST(request: Request) {
  const me = await getCurrentUser();
  if (!me || (me.role !== 'va' && me.role !== 'admin')) {
    return new Response('Forbidden', { status: 403 });
  }

  let body: { clientProfileId?: string; messages?: IncomingMessage[] };
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { clientProfileId, messages } = body;
  if (!clientProfileId || !Array.isArray(messages) || messages.length === 0) {
    return new Response('clientProfileId and messages are required', { status: 400 });
  }

  const client = await db.query.clientProfiles.findFirst({
    where: eq(clientProfiles.id, clientProfileId),
  });
  if (!client) return new Response('Client not found', { status: 404 });
  if (me.role === 'va' && client.assignedVaId !== me.id) {
    return new Response('Not assigned to this client', { status: 403 });
  }

  const ctx: AgentContext = {
    clientProfileId,
    userId: me.id,
    role: me.role,
  };

  const history: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      try {
        for await (const event of runAgentTurn(ctx, history)) {
          send(event);
        }
      } catch (err) {
        send({ type: 'error', message: err instanceof Error ? err.message : 'Agent failed.' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
