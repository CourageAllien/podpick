'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { clientUpdateDraft, clientMarkResponseSent } from '@/app/actions/responses';
import { sendLeadResponse } from '@/app/actions/hot-leads';

export function ClientLeadReview({
  lifecycleId,
  stage,
  hostName,
  hostReply,
  hostSubject,
  hostEmail,
  draft,
  mediaPageUrl,
  bookingLink,
  unipileConnected,
  clientSentAt,
}: {
  lifecycleId: string;
  stage: string;
  hostName: string | null;
  hostReply: string | null;
  hostSubject: string | null;
  hostEmail: string | null;
  draft: string;
  mediaPageUrl: string;
  bookingLink: string | null;
  unipileConnected: boolean;
  clientSentAt: string | null;
}) {
  const [text, setText] = useState(draft);
  const [savedDraft, setSavedDraft] = useState(draft);
  const [sent, setSent] = useState(Boolean(clientSentAt));
  const [isPending, startTransition] = useTransition();

  const dirty = text !== savedDraft;

  function save() {
    startTransition(async () => {
      const res = await clientUpdateDraft(lifecycleId, text);
      if ('error' in res) { toast.error(res.error); return; }
      toast.success('Saved');
      setSavedDraft(text);
    });
  }

  function copy() {
    navigator.clipboard.writeText(text).then(
      () => toast.success('Copied. Paste it into your reply to the host.'),
      () => toast.error('Could not copy')
    );
  }

  function sendFromInbox() {
    startTransition(async () => {
      const res = await sendLeadResponse(lifecycleId, text);
      if ('error' in res) { toast.error(res.error); return; }
      toast.success('Sent to the host from your inbox.');
      setSavedDraft(text);
      setSent(true);
    });
  }

  function markSent() {
    startTransition(async () => {
      const res = await clientMarkResponseSent(lifecycleId);
      if ('error' in res) { toast.error(res.error); return; }
      toast.success('Marked as sent. Nice.');
      setSent(true);
    });
  }

  return (
    <div className="space-y-4">
      {hostReply && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              What {hostName ?? 'the host'} said
              {hostEmail && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">{hostEmail}</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {hostSubject && <p className="font-medium">{hostSubject}</p>}
            <p className="whitespace-pre-line text-stone-700">{hostReply}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base">Your reply</CardTitle>
          {sent ? (
            <Badge variant="success">Sent</Badge>
          ) : (
            <Badge variant="secondary">{stage}</Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            We drafted this for you. Edit anything you like, then send it to the host from your own
            inbox. We never send on your behalf.
          </p>
          <Textarea rows={9} value={text} onChange={(e) => setText(e.target.value)} />

          <div className="flex flex-wrap gap-2">
            {unipileConnected ? (
              <Button size="sm" variant="default" onClick={sendFromInbox} disabled={isPending || sent}>
                {sent ? 'Sent' : 'Send from my inbox'}
              </Button>
            ) : (
              <Button size="sm" variant="default" onClick={markSent} disabled={isPending || sent}>
                {sent ? 'Marked sent' : 'I sent it manually'}
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={save} disabled={isPending || !dirty}>
              Save edits
            </Button>
            <Button size="sm" variant="ghost" onClick={copy} disabled={isPending}>
              Copy reply
            </Button>
          </div>
          {!unipileConnected && (
            <p className="text-xs text-muted-foreground">
              Connect your sending inbox to send replies directly from here. Until then, copy the
              reply and send it from your own email, then mark it sent.
            </p>
          )}

          <div className="flex gap-4 pt-1 text-xs">
            <a className="text-terracotta underline" href={mediaPageUrl} target="_blank" rel="noreferrer">
              Your media page
            </a>
            {bookingLink && (
              <a className="text-terracotta underline" href={bookingLink} target="_blank" rel="noreferrer">
                Your booking link
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
