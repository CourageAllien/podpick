'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { saveHostContext } from '@/app/actions/host-context';

type RecentPost = {
  source: 'linkedin' | 'substack' | 'twitter' | 'medium' | 'other';
  title: string;
  body: string;
  url: string;
  date: string;
};

type InterviewQuote = { source: string; quote: string; url?: string; context?: string };

type HostItem = {
  podcastId: string;
  podcastTitle: string;
  hostName: string;
  linkedinUrl: string;
  linkedinSummary: string;
  substackUrl: string;
  personalJourney: string;
  recentPosts: RecentPost[];
  interviewQuotes: InterviewQuote[];
  hasSufficientContext: boolean;
  isSilentStep1: boolean;
  alreadyStep2: boolean;
  lastRefreshedAt: string | null;
};

export function HostContextList({
  clientProfileId,
  items,
}: {
  clientProfileId: string;
  items: HostItem[];
}) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <HostCard key={item.podcastId} clientProfileId={clientProfileId} item={item} />
      ))}
    </div>
  );
}

const POST_SOURCES: RecentPost['source'][] = ['linkedin', 'substack', 'twitter', 'medium', 'other'];

function HostCard({
  clientProfileId,
  item,
}: {
  clientProfileId: string;
  item: HostItem;
}) {
  const [open, setOpen] = useState(item.isSilentStep1 && !item.hasSufficientContext);
  const [hostName, setHostName] = useState(item.hostName);
  const [linkedinUrl, setLinkedinUrl] = useState(item.linkedinUrl);
  const [linkedinSummary, setLinkedinSummary] = useState(item.linkedinSummary);
  const [substackUrl, setSubstackUrl] = useState(item.substackUrl);
  const [personalJourney, setPersonalJourney] = useState(item.personalJourney);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>(item.recentPosts);
  const [interviewQuotes, setInterviewQuotes] = useState<InterviewQuote[]>(item.interviewQuotes);
  const [sufficient, setSufficient] = useState(item.hasSufficientContext);
  const [isPending, startTransition] = useTransition();

  function updatePost(i: number, patch: Partial<RecentPost>) {
    setRecentPosts((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }
  function addPost() {
    setRecentPosts((prev) => [
      ...prev,
      { source: 'linkedin', title: '', body: '', url: '', date: '' },
    ]);
  }
  function removePost(i: number) {
    setRecentPosts((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateQuote(i: number, patch: Partial<InterviewQuote>) {
    setInterviewQuotes((prev) => prev.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));
  }
  function addQuote() {
    setInterviewQuotes((prev) => [...prev, { source: '', quote: '', url: '' }]);
  }
  function removeQuote(i: number) {
    setInterviewQuotes((prev) => prev.filter((_, idx) => idx !== i));
  }

  function save() {
    startTransition(async () => {
      const res = await saveHostContext({
        clientProfileId,
        podcastId: item.podcastId,
        hostName,
        linkedinUrl,
        linkedinSummary,
        substackUrl,
        personalJourney,
        recentPosts,
        interviewQuotes,
        hasSufficientContext: sufficient,
      });
      if ('error' in res) {
        toast.error(res.error);
        return;
      }
      toast.success('Host context saved');
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{item.podcastTitle}</span>
            {item.hasSufficientContext ? (
              <Badge variant="success">Step 2 ready</Badge>
            ) : (
              <Badge variant="muted">No context</Badge>
            )}
            {item.isSilentStep1 && !item.alreadyStep2 && (
              <Badge variant="default">Silent Step 1</Badge>
            )}
            {item.alreadyStep2 && <Badge variant="secondary">Step 2 sent</Badge>}
          </div>
          {item.hostName && <p className="text-sm text-muted-foreground">{item.hostName}</p>}
        </div>
        <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>
          {open ? 'Collapse' : 'Edit'}
        </Button>
      </CardHeader>

      {open && (
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Host name">
              <Input value={hostName} onChange={(e) => setHostName(e.target.value)} />
            </Field>
            <Field label="LinkedIn URL">
              <Input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
            </Field>
            <Field label="Substack URL">
              <Input value={substackUrl} onChange={(e) => setSubstackUrl(e.target.value)} />
            </Field>
          </div>

          <Field label="LinkedIn summary">
            <Textarea
              rows={3}
              value={linkedinSummary}
              onChange={(e) => setLinkedinSummary(e.target.value)}
              placeholder="What the host's LinkedIn presence is about, in your words."
            />
          </Field>

          <Field label="Personal journey">
            <Textarea
              rows={3}
              value={personalJourney}
              onChange={(e) => setPersonalJourney(e.target.value)}
              placeholder="The host's arc: where they came from, what they've built, what they care about."
            />
          </Field>

          {/* Recent posts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Recent posts ({recentPosts.length})
              </p>
              <Button size="sm" variant="outline" onClick={addPost}>
                Add post
              </Button>
            </div>
            {recentPosts.map((p, i) => (
              <div key={i} className="space-y-2 rounded-md border p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <select
                    className="rounded-md border bg-background px-2 py-1.5 text-sm"
                    value={p.source}
                    onChange={(e) => updatePost(i, { source: e.target.value as RecentPost['source'] })}
                  >
                    {POST_SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <Input
                    placeholder="Date (e.g. 2026-05-01)"
                    value={p.date}
                    onChange={(e) => updatePost(i, { date: e.target.value })}
                  />
                </div>
                <Input
                  placeholder="Title"
                  value={p.title}
                  onChange={(e) => updatePost(i, { title: e.target.value })}
                />
                <Input
                  placeholder="URL"
                  value={p.url}
                  onChange={(e) => updatePost(i, { url: e.target.value })}
                />
                <Textarea
                  rows={3}
                  placeholder="Post body / excerpt"
                  value={p.body}
                  onChange={(e) => updatePost(i, { body: e.target.value })}
                />
                <Button size="sm" variant="ghost" onClick={() => removePost(i)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>

          {/* Interview quotes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Interview quotes ({interviewQuotes.length})
              </p>
              <Button size="sm" variant="outline" onClick={addQuote}>
                Add quote
              </Button>
            </div>
            {interviewQuotes.map((q, i) => (
              <div key={i} className="space-y-2 rounded-md border p-3">
                <Input
                  placeholder="Source (e.g. podcast / article name)"
                  value={q.source}
                  onChange={(e) => updateQuote(i, { source: e.target.value })}
                />
                <Input
                  placeholder="URL (optional)"
                  value={q.url ?? ''}
                  onChange={(e) => updateQuote(i, { url: e.target.value })}
                />
                <Textarea
                  rows={2}
                  placeholder="The quote"
                  value={q.quote}
                  onChange={(e) => updateQuote(i, { quote: e.target.value })}
                />
                <Button size="sm" variant="ghost" onClick={() => removeQuote(i)}>
                  Remove
                </Button>
              </div>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={sufficient}
              onChange={(e) => setSufficient(e.target.checked)}
            />
            Enough honest material for a Step 2 pitch (unlocks Step 2 for this host)
          </label>

          <div className="flex items-center gap-3">
            <Button size="sm" onClick={save} disabled={isPending}>
              {isPending ? 'Saving…' : 'Save context'}
            </Button>
            {item.lastRefreshedAt && (
              <span className="text-xs text-muted-foreground">
                Last updated {new Date(item.lastRefreshedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
