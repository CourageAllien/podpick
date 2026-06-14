'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { sendLeadResponse } from '@/app/actions/hot-leads';
import { sendClientMessage, markClientRead, type ThreadMessage } from '@/app/actions/messages';
import { startUnipileConnect } from '@/app/actions/intake';
import { MessageThread } from '@/components/message-thread';

export type DashboardPitch = {
  id: string;
  podcastTitle: string;
  hostName: string | null;
  status: string;
  step: string;
  subject: string | null;
  body: string | null;
  sentAt: string | null;
};

export type DashboardLead = {
  id: string;
  stage: string;
  vaDraftResponse: string | null;
  bookedFor: string | null;
};

const DRAFT_STATUSES = ['draft', 'queued', 'scheduled'];

function fmtDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function Dashboard(props: {
  name: string;
  slug: string;
  status: string;
  trialEndsAt: string | null;
  tier: string | null;
  quota: number | null;
  used: number;
  subStatus: string | null;
  unipileConnected: boolean;
  warmupMode: boolean;
  cadence: number[];
  meId: string;
  messages: ThreadMessage[];
  pitches: DashboardPitch[];
  hotLeads: DashboardLead[];
}) {
  const [openPitch, setOpenPitch] = useState<DashboardPitch | null>(null);

  const drafts = props.pitches.filter((p) => DRAFT_STATUSES.includes(p.status));
  const live = props.pitches.filter((p) => p.status === 'sent');
  const replied = props.pitches.filter((p) => p.status === 'replied');
  const booked = props.hotLeads.filter((l) => l.stage === 'booked' || l.stage === 'recorded' || l.stage === 'live');

  const trialDaysLeft = props.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(props.trialEndsAt).getTime() - Date.now()) / 86_400_000))
    : null;

  const quotaExhausted = props.quota != null && props.used >= props.quota;
  const paused = props.subStatus === 'paused';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="font-serif text-xl">PodEngine</div>
          <form action="/auth/signout" method="post">
            <Button variant="ghost" size="sm" type="submit">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="font-serif text-3xl">Welcome back, {props.name.split(' ')[0]}</h1>

        {props.status === 'trialing' && (
          <div className="mt-4 rounded-lg border border-terracotta-200 bg-terracotta-50 p-4 text-sm">
            <span className="font-medium text-terracotta-700">
              Trial active{trialDaysLeft !== null ? ` — ${trialDaysLeft} days left` : ''}.
            </span>{' '}
            Your first pitches go out within 5 business days.
          </div>
        )}

        {paused && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <span className="font-medium">Your plan is paused.</span> Sending is on hold until you
            resume. Replies and existing leads stay available. Resume any time from Manage billing.
          </div>
        )}

        {!paused && quotaExhausted && (
          <div className="mt-4 rounded-lg border border-stone-200 bg-stone-50 p-4 text-sm text-stone-700">
            <span className="font-medium">You have used all {props.quota} pitches this period.</span>{' '}
            New sends resume when your period rolls over. Follow-ups and replies continue as normal.
          </div>
        )}

        <Tabs defaultValue="pitches" className="mt-6">
          <TabsList>
            <TabsTrigger value="pitches">Pitches</TabsTrigger>
            <TabsTrigger value="hot">Hot Leads</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* PITCHES */}
          <TabsContent value="pitches">
            {props.pitches.length === 0 ? (
              <EmptyState
                title="No pitches yet"
                body="Your VA is researching shows now. The first batch lands here once it ships."
              />
            ) : (
              <div className="space-y-6">
                <PitchSection title="Drafts" pitches={drafts} onOpen={setOpenPitch} />
                <PitchSection title="Live" pitches={live} onOpen={setOpenPitch} />
                <PitchSection title="Replied" pitches={replied} onOpen={setOpenPitch} />
                {booked.length > 0 && (
                  <div>
                    <h2 className="mb-2 font-serif text-xl">Booked</h2>
                    <p className="text-sm text-muted-foreground">{booked.length} booked</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* HOT LEADS */}
          <TabsContent value="hot">
            <HotLeads leads={props.hotLeads} unipileConnected={props.unipileConnected} />
          </TabsContent>

          {/* MESSAGES */}
          <TabsContent value="messages">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Async chat with your VA. They reply during working hours. For anything urgent about a
                hot lead, send the reply from your inbox first, then message here.
              </p>
              <MessageThread
                meId={props.meId}
                initialMessages={props.messages}
                send={sendClientMessage}
                markRead={markClientRead}
                emptyHint="No messages yet. Ask your VA anything about your pitches or strategy."
              />
            </div>
          </TabsContent>

          {/* SETTINGS */}
          <TabsContent value="settings">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    Tier: <span className="font-medium">{props.tier ?? 'trial'}</span>
                  </p>
                  <p>
                    Quota: {props.used}/{props.quota ?? '—'} pitches this period
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://billing.stripe.com/p/login" target="_blank" rel="noreferrer">
                      Manage billing
                    </a>
                  </Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Sending inbox</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p>
                    Status:{' '}
                    {props.unipileConnected ? (
                      <Badge variant="success">Connected</Badge>
                    ) : (
                      <Badge variant="muted">Not connected</Badge>
                    )}
                  </p>
                  <p className="text-muted-foreground">
                    {props.unipileConnected
                      ? 'Pitches and replies send from your own inbox. If sends start failing, reconnect to refresh access.'
                      : 'Connect your inbox so pitches and replies send from your own address.'}
                  </p>
                  <ReconnectInbox connected={props.unipileConnected} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Send strategy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    Cadence:{' '}
                    <span className="font-medium">{props.cadence.join('-')}</span> pitches across weeks
                    1 to 4.
                  </p>
                  {props.warmupMode && (
                    <p className="text-muted-foreground">
                      <Badge variant="secondary">Warmup</Badge> Your domain is new, so week one starts
                      gentle and ramps up to protect deliverability.
                    </p>
                  )}
                  <p className="text-muted-foreground">
                    We send Tuesday through Thursday, mornings, spaced out, so each pitch lands well.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Media page</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <a className="text-terracotta underline" href={`/m/${props.slug}`} target="_blank" rel="noreferrer">
                    View your public page
                  </a>
                  <Button variant="outline" size="sm" asChild>
                    <a href="/app/intake">Update intake info</a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Side drawer */}
      {openPitch && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setOpenPitch(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="font-serif text-xl">{openPitch.podcastTitle}</h3>
                {openPitch.hostName && <p className="text-sm text-muted-foreground">{openPitch.hostName}</p>}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setOpenPitch(null)}>
                Close
              </Button>
            </div>
            <div className="mb-3 flex gap-2">
              <Badge variant="secondary">{openPitch.step === 'step2' ? 'Step 2' : 'Step 1'}</Badge>
              <Badge variant="outline">{openPitch.status}</Badge>
            </div>
            {openPitch.subject && <p className="mb-2 font-medium">{openPitch.subject}</p>}
            <p className="whitespace-pre-line text-sm text-stone-700">{openPitch.body || 'No body yet.'}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function PitchSection({
  title,
  pitches,
  onOpen,
}: {
  title: string;
  pitches: DashboardPitch[];
  onOpen: (p: DashboardPitch) => void;
}) {
  if (pitches.length === 0) return null;
  return (
    <div>
      <h2 className="mb-2 font-serif text-xl">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {pitches.map((p) => (
          <button
            key={p.id}
            onClick={() => onOpen(p)}
            className="rounded-lg border bg-card p-4 text-left transition-colors hover:border-terracotta-300"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{p.podcastTitle}</span>
              <Badge variant="secondary">{p.step === 'step2' ? 'S2' : 'S1'}</Badge>
            </div>
            {p.hostName && <p className="text-sm text-muted-foreground">{p.hostName}</p>}
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline">{p.status}</Badge>
              {p.sentAt && <span>Sent {fmtDate(p.sentAt)}</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function HotLeads({ leads, unipileConnected }: { leads: DashboardLead[]; unipileConnected: boolean }) {
  const active = leads.filter((l) =>
    ['new', 'va_drafted', 'client_notified', 'response_sent'].includes(l.stage)
  );
  if (active.length === 0) {
    return <EmptyState title="No hot leads yet" body="When a host replies with interest, it surfaces here for you to respond." />;
  }
  return (
    <div className="space-y-3">
      {active.map((l) => (
        <LeadCard key={l.id} lead={l} unipileConnected={unipileConnected} />
      ))}
    </div>
  );
}

function LeadCard({ lead, unipileConnected }: { lead: DashboardLead; unipileConnected: boolean }) {
  const [body, setBody] = useState(lead.vaDraftResponse || '');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(lead.stage === 'response_sent');

  async function send() {
    setSending(true);
    const res = await sendLeadResponse(lead.id, body);
    setSending(false);
    if ('error' in res) {
      toast.error(res.error);
      return;
    }
    setSent(true);
    toast.success('Sent from your inbox');
  }

  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex items-center justify-between">
          <Badge variant={sent ? 'success' : 'default'}>{sent ? 'response_sent' : lead.stage}</Badge>
        </div>
        {lead.stage === 'client_notified' && !sent ? (
          <>
            <p className="text-sm text-muted-foreground">Your VA drafted this reply. Edit, then send from your inbox.</p>
            <Textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
            <Button onClick={send} disabled={sending || !unipileConnected || !body.trim()}>
              {sending ? 'Sending...' : 'Edit + Send from My Inbox'}
            </Button>
            {!unipileConnected && (
              <p className="text-xs text-destructive">Connect your sending inbox in Settings first.</p>
            )}
          </>
        ) : (
          <p className="whitespace-pre-line text-sm text-stone-700">{body || 'Awaiting VA draft.'}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ReconnectInbox({ connected }: { connected: boolean }) {
  const [busy, setBusy] = useState(false);

  async function connect(provider: 'GOOGLE' | 'OUTLOOK') {
    setBusy(true);
    const res = await startUnipileConnect(provider);
    setBusy(false);
    if ('error' in res) {
      toast.error(res.error);
      return;
    }
    window.location.href = res.url;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" disabled={busy} onClick={() => connect('GOOGLE')}>
        {connected ? 'Reconnect Google' : 'Connect Google'}
      </Button>
      <Button variant="outline" size="sm" disabled={busy} onClick={() => connect('OUTLOOK')}>
        {connected ? 'Reconnect Outlook' : 'Connect Outlook'}
      </Button>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <h3 className="font-serif text-xl">{title}</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}
