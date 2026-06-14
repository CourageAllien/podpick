'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { approvePitch, approvePitches, rejectPitch, updatePitchDraft } from '@/app/actions/review';

type Draft = {
  id: string;
  step: string;
  subject: string;
  body: string;
  angleUsed: number | null;
  podcastTitle: string;
  hostName: string | null;
  hasHostEmail: boolean;
};

function wordCount(s: string): number {
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}

export function ReviewList({
  clientProfileId,
  drafts,
}: {
  clientProfileId: string;
  drafts: Draft[];
}) {
  const [items, setItems] = useState<Draft[]>(drafts);
  const [isPending, startTransition] = useTransition();

  function remove(id: string) {
    setItems((prev) => prev.filter((d) => d.id !== id));
  }

  function approveAll() {
    const ids = items.map((d) => d.id);
    startTransition(async () => {
      const res = await approvePitches(ids);
      if ('error' in res) {
        toast.error(res.error);
        return;
      }
      toast.success(`Approved ${ids.length} pitch${ids.length === 1 ? '' : 'es'} for sending`);
      setItems([]);
    });
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No drafts awaiting review. Generate pitches from the research assistant, then they appear
          here for approval.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
        <span className="text-sm text-muted-foreground">
          {items.length} draft{items.length === 1 ? '' : 's'} in this batch
        </span>
        <Button onClick={approveAll} disabled={isPending}>
          {isPending ? 'Approving…' : `Approve all (${items.length})`}
        </Button>
      </div>

      {items.map((d) => (
        <ReviewCard key={d.id} draft={d} onResolved={() => remove(d.id)} />
      ))}
    </div>
  );
}

function ReviewCard({ draft, onResolved }: { draft: Draft; onResolved: () => void }) {
  const [subject, setSubject] = useState(draft.subject);
  const [body, setBody] = useState(draft.body);
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const dirty = subject !== draft.subject || body !== draft.body;
  const wc = wordCount(body);
  const overLimit = draft.step === 'step2' ? wc > 110 : wc > 90;

  function save() {
    startTransition(async () => {
      const res = await updatePitchDraft(draft.id, subject, body);
      if ('error' in res) {
        toast.error(res.error);
        return;
      }
      toast.success('Draft updated');
      setEditing(false);
      draft.subject = subject;
      draft.body = body;
    });
  }

  function approve() {
    if (dirty) {
      toast.error('Save or revert your edits before approving.');
      return;
    }
    startTransition(async () => {
      const res = await approvePitch(draft.id);
      if ('error' in res) {
        toast.error(res.error);
        return;
      }
      toast.success('Approved for sending');
      onResolved();
    });
  }

  function reject() {
    startTransition(async () => {
      const res = await rejectPitch(draft.id);
      if ('error' in res) {
        toast.error(res.error);
        return;
      }
      toast.success('Draft rejected');
      onResolved();
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{draft.podcastTitle}</span>
            <Badge variant="secondary">{draft.step === 'step2' ? 'Step 2' : 'Step 1'}</Badge>
            {draft.angleUsed && <Badge variant="outline">Angle {draft.angleUsed}</Badge>}
          </div>
          {draft.hostName && <p className="text-sm text-muted-foreground">{draft.hostName}</p>}
        </div>
        <div className="text-right text-xs">
          <span className={overLimit ? 'font-medium text-destructive' : 'text-muted-foreground'}>
            {wc} words
          </span>
          {!draft.hasHostEmail && (
            <p className="mt-1 text-destructive">No host email on file</p>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {editing ? (
          <>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
            <Textarea rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
            <div className="flex gap-2">
              <Button size="sm" onClick={save} disabled={isPending || !dirty}>
                {isPending ? 'Saving…' : 'Save edits'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSubject(draft.subject);
                  setBody(draft.body);
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="font-medium">{subject || <span className="text-muted-foreground">No subject</span>}</p>
            <p className="whitespace-pre-line text-sm text-stone-700">{body || 'No body.'}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" onClick={approve} disabled={isPending}>
                Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(true)} disabled={isPending}>
                Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={reject} disabled={isPending}>
                Reject
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
