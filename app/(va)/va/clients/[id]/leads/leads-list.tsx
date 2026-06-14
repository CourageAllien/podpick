'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  generateVaDraftResponse,
  saveVaDraftResponse,
  forwardPositiveReplyToClient,
  updateLifecycleStage,
  recordBooking,
} from '@/app/actions/responses';

export type LeadItem = {
  lifecycleId: string;
  stage: string;
  podcastTitle: string;
  hostName: string | null;
  classification: string;
  hostReply: string | null;
  hostSubject: string | null;
  fromEmail: string | null;
  vaDraftResponse: string | null;
  clientNotifiedAt: string | null;
  clientSentAt: string | null;
  bookedFor: string | null;
  receivedAt: string | null;
};

const STAGE_VARIANT: Record<string, 'default' | 'secondary' | 'success' | 'muted' | 'outline'> = {
  new: 'default',
  va_drafted: 'secondary',
  client_notified: 'secondary',
  response_sent: 'outline',
  in_conversation: 'outline',
  booked: 'success',
  recorded: 'success',
  live: 'success',
  dropped: 'muted',
};

export function LeadsList({ items }: { items: LeadItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <LeadCard key={item.lifecycleId} item={item} />
      ))}
    </div>
  );
}

function LeadCard({ item }: { item: LeadItem }) {
  const [draft, setDraft] = useState(item.vaDraftResponse ?? '');
  const [stage, setStage] = useState(item.stage);
  const [notified, setNotified] = useState(Boolean(item.clientNotifiedAt));
  const [isPending, startTransition] = useTransition();

  const dirty = draft !== (item.vaDraftResponse ?? '');

  function genDraft() {
    startTransition(async () => {
      const res = await generateVaDraftResponse(item.lifecycleId);
      if ('error' in res) { toast.error(res.error); return; }
      toast.success('Draft generated — reload to see it, or edit below.');
      if (stage === 'new') setStage('va_drafted');
    });
  }

  function saveDraft() {
    startTransition(async () => {
      const res = await saveVaDraftResponse(item.lifecycleId, draft);
      if ('error' in res) { toast.error(res.error); return; }
      toast.success('Draft saved');
      item.vaDraftResponse = draft;
      if (stage === 'new') setStage('va_drafted');
    });
  }

  function notifyClient() {
    if (dirty) return toast.error('Save your draft edits before notifying the client.');
    startTransition(async () => {
      const res = await forwardPositiveReplyToClient(item.lifecycleId);
      if ('error' in res) { toast.error(res.error); return; }
      toast.success('Client notified');
      setNotified(true);
      setStage('client_notified');
    });
  }

  function changeStage(next: string) {
    startTransition(async () => {
      const res = await updateLifecycleStage(item.lifecycleId, next as Parameters<typeof updateLifecycleStage>[1]);
      if ('error' in res) { toast.error(res.error); return; }
      toast.success(`Moved to ${next}`);
      setStage(next);
    });
  }

  function book() {
    const value = window.prompt('Recording date (YYYY-MM-DD):');
    if (!value) return;
    startTransition(async () => {
      const res = await recordBooking(item.lifecycleId, value);
      if ('error' in res) { toast.error(res.error); return; }
      toast.success('Booking recorded');
      setStage('booked');
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{item.podcastTitle}</span>
            <Badge variant={STAGE_VARIANT[stage] ?? 'secondary'}>{stage}</Badge>
            <Badge variant="outline">{item.classification}</Badge>
          </div>
          {item.hostName && <p className="text-sm text-muted-foreground">{item.hostName}</p>}
        </div>
        <div className="text-right text-xs text-muted-foreground">
          {item.fromEmail && <p>{item.fromEmail}</p>}
          {item.bookedFor && (
            <p className="text-emerald-600">Booked {new Date(item.bookedFor).toLocaleDateString()}</p>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {item.hostReply && (
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            {item.hostSubject && <p className="font-medium">{item.hostSubject}</p>}
            <p className="whitespace-pre-line text-stone-700">{item.hostReply}</p>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Suggested client response
            </p>
            <Button size="sm" variant="outline" onClick={genDraft} disabled={isPending}>
              {item.vaDraftResponse ? 'Regenerate' : 'Generate draft'}
            </Button>
          </div>
          <Textarea
            rows={6}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Generate a draft, or write the response the client should send."
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={saveDraft} disabled={isPending || !dirty}>
              Save draft
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={notifyClient}
              disabled={isPending || !item.vaDraftResponse}
            >
              {notified ? 'Re-notify client' : 'Notify client'}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t pt-3 text-xs">
          <span className="text-muted-foreground">Move to:</span>
          <Button size="sm" variant="ghost" onClick={() => changeStage('in_conversation')} disabled={isPending}>
            In conversation
          </Button>
          <Button size="sm" variant="ghost" onClick={book} disabled={isPending}>
            Booked…
          </Button>
          <Button size="sm" variant="ghost" onClick={() => changeStage('dropped')} disabled={isPending}>
            Dropped
          </Button>
          {item.clientSentAt && (
            <span className="text-muted-foreground">
              Client sent {new Date(item.clientSentAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
