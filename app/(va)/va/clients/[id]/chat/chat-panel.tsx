'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

type Activity = { id: string; name: string; status: 'running' | 'ok' | 'error'; summary?: string };

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  activity?: Activity[];
};

const SUGGESTIONS = [
  'Show me this client’s intake summary.',
  'Find 5 B2B SaaS marketing podcasts under 10k listeners and rank them.',
  'What’s their pitch quota look like this period?',
];

export function ChatPanel({
  clientProfileId,
  clientName,
}: {
  clientProfileId: string;
  clientName: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollToEnd() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    });
  }

  async function send(text: string) {
    const prompt = text.trim();
    if (!prompt || busy) return;

    const history = [...messages, { role: 'user' as const, content: prompt }];
    // Seed an empty assistant message we stream into.
    setMessages([...history, { role: 'assistant', content: '', activity: [] }]);
    setInput('');
    setBusy(true);
    scrollToEnd();

    const wireHistory = history.map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientProfileId, messages: wireHistory }),
      });
      if (!res.ok || !res.body) {
        throw new Error((await res.text()) || `Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      // Mutates the last (assistant) message in place via functional update.
      const patchAssistant = (fn: (m: ChatMessage) => ChatMessage) =>
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = fn(next[next.length - 1]);
          return next;
        });

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() ?? '';
        for (const chunk of chunks) {
          const line = chunk.split('\n').find((l) => l.startsWith('data: '));
          if (!line) continue;
          const event = JSON.parse(line.slice(6));

          if (event.type === 'text') {
            patchAssistant((m) => ({ ...m, content: m.content + event.text }));
            scrollToEnd();
          } else if (event.type === 'tool_call') {
            patchAssistant((m) => ({
              ...m,
              activity: [
                ...(m.activity ?? []),
                { id: event.id, name: event.name, status: 'running' },
              ],
            }));
          } else if (event.type === 'tool_result') {
            patchAssistant((m) => ({
              ...m,
              activity: (m.activity ?? []).map((a) =>
                a.id === event.id
                  ? { ...a, status: event.ok ? 'ok' : 'error', summary: event.summary }
                  : a
              ),
            }));
          } else if (event.type === 'error') {
            patchAssistant((m) => ({
              ...m,
              content: m.content + `\n\n[error] ${event.message}`,
            }));
          }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        next[next.length - 1] = {
          ...last,
          content: last.content || `Something went wrong: ${err instanceof Error ? err.message : 'unknown error'}`,
        };
        return next;
      });
    } finally {
      setBusy(false);
      scrollToEnd();
    }
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-lg border bg-card">
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <p className="max-w-sm text-sm text-muted-foreground">
              Ask the assistant to research shows or pull up {clientName}&apos;s details. It runs the
              tools and reports back. It can&apos;t send anything.
            </p>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-md border px-3 py-1.5 text-sm text-muted-foreground hover:border-terracotta-300 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={
                  m.role === 'user'
                    ? 'max-w-[80%] rounded-lg bg-terracotta px-3 py-2 text-sm text-white'
                    : 'max-w-[85%] space-y-2'
                }
              >
                {m.role === 'assistant' && m.activity && m.activity.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {m.activity.map((a) => (
                      <Badge
                        key={a.id}
                        variant={a.status === 'error' ? 'muted' : a.status === 'ok' ? 'success' : 'secondary'}
                        title={a.summary}
                      >
                        {a.status === 'running' ? `${a.name}…` : a.summary ?? a.name}
                      </Badge>
                    ))}
                  </div>
                )}
                {m.content && (
                  <div
                    className={
                      m.role === 'assistant'
                        ? 'whitespace-pre-wrap rounded-lg border bg-background px-3 py-2 text-sm'
                        : 'whitespace-pre-wrap'
                    }
                  >
                    {m.content}
                  </div>
                )}
                {m.role === 'assistant' && !m.content && (!m.activity || m.activity.length === 0) && (
                  <div className="rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground">
                    Thinking…
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t p-3"
      >
        <div className="flex items-end gap-2">
          <Textarea
            rows={2}
            value={input}
            disabled={busy}
            placeholder={`Message the assistant about ${clientName}…`}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
          />
          <Button type="submit" disabled={busy || !input.trim()}>
            {busy ? 'Working…' : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  );
}
