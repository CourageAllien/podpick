'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { ThreadMessage } from '@/app/actions/messages';

/**
 * Shared async message thread, used by both the client dashboard and the VA
 * workspace. The `send` and `markRead` props are bound server actions, so the
 * same component drives both sides without knowing which role it is rendering.
 */
export function MessageThread({
  meId,
  initialMessages,
  send,
  markRead,
  emptyHint = 'No messages yet. Say hello.',
}: {
  meId: string;
  initialMessages: ThreadMessage[];
  send: (body: string) => Promise<{ ok: true } | { error: string }>;
  markRead?: () => Promise<{ ok: true } | { error: string }>;
  emptyHint?: string;
}) {
  const [items, setItems] = useState<ThreadMessage[]>(initialMessages);
  const [text, setText] = useState('');
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setItems(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [items.length]);

  useEffect(() => {
    if (markRead) void markRead();
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    startTransition(async () => {
      const res = await send(body);
      if ('error' in res) {
        toast.error(res.error);
        return;
      }
      setItems((prev) => [
        ...prev,
        {
          id: `local-${Date.now()}`,
          senderId: meId,
          senderRole: 'client',
          body,
          createdAt: new Date().toISOString(),
        },
      ]);
      setText('');
    });
  }

  return (
    <div className="flex h-[28rem] flex-col rounded-lg border bg-card">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {items.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">{emptyHint}</p>
        ) : (
          items.map((m) => {
            const mine = m.senderId === meId;
            return (
              <div key={m.id} className={mine ? 'flex justify-end' : 'flex justify-start'}>
                <div
                  className={
                    mine
                      ? 'max-w-[75%] rounded-lg bg-terracotta px-3 py-2 text-sm text-white'
                      : 'max-w-[75%] rounded-lg bg-muted px-3 py-2 text-sm text-stone-800'
                  }
                >
                  <p className="whitespace-pre-line">{m.body}</p>
                  <p className={mine ? 'mt-1 text-[10px] text-white/70' : 'mt-1 text-[10px] text-muted-foreground'}>
                    {new Date(m.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={submit} className="border-t p-3">
        <Textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(e);
          }}
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Cmd/Ctrl + Enter to send</span>
          <Button type="submit" size="sm" disabled={isPending || !text.trim()}>
            {isPending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  );
}
