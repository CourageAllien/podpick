'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createPromptVersion, setCurrentPrompt } from '@/app/actions/training';

export type PromptRow = {
  id: string;
  version: number;
  step: 'step1' | 'step2';
  promptText: string;
  changeNote: string | null;
  isCurrent: boolean;
  createdAt: string | null;
  authorName: string | null;
};

const STEP_LABEL: Record<'step1' | 'step2', string> = {
  step1: 'Step 1 · episode-based',
  step2: 'Step 2 · host-based',
};

export function PromptsManager({ items }: { items: PromptRow[] }) {
  return (
    <div className="space-y-8">
      <PublishForm />
      {(['step1', 'step2'] as const).map((step) => {
        const rows = items.filter((i) => i.step === step);
        if (rows.length === 0) return null;
        return (
          <section key={step} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {STEP_LABEL[step]}
            </h2>
            {rows.map((row) => (
              <PromptCard key={row.id} row={row} />
            ))}
          </section>
        );
      })}
    </div>
  );
}

function PublishForm() {
  const [step, setStep] = useState<'step1' | 'step2'>('step1');
  const [promptText, setPromptText] = useState('');
  const [changeNote, setChangeNote] = useState('');
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createPromptVersion({ step, promptText, changeNote });
      if ('error' in res) {
        toast.error(res.error);
        return;
      }
      toast.success('New version published and set live.');
      setPromptText('');
      setChangeNote('');
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Publish a new version</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt-step">Step</Label>
            <select
              id="prompt-step"
              value={step}
              onChange={(e) => setStep(e.target.value as 'step1' | 'step2')}
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="step1">Step 1 · episode-based</option>
              <option value="step2">Step 2 · host-based</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="prompt-text">Prompt text</Label>
            <Textarea
              id="prompt-text"
              rows={12}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="The base writing instructions for this step..."
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prompt-note">Change note</Label>
            <Textarea
              id="prompt-note"
              rows={2}
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder="What changed and why."
            />
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Publishing...' : 'Publish and set live'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PromptCard({ row }: { row: PromptRow }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function makeCurrent() {
    startTransition(async () => {
      const res = await setCurrentPrompt(row.id);
      if ('error' in res) {
        toast.error(res.error);
        return;
      }
      toast.success(`Version ${row.version} is now live.`);
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Version {row.version}</span>
            {row.isCurrent && <Badge variant="success">Live</Badge>}
          </div>
          {row.changeNote && (
            <p className="mt-1 text-sm text-muted-foreground">{row.changeNote}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {row.authorName ?? 'Seed'}
            {row.createdAt ? ` · ${new Date(row.createdAt).toLocaleDateString()}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>
            {open ? 'Hide' : 'View'}
          </Button>
          {!row.isCurrent && (
            <Button size="sm" variant="outline" onClick={makeCurrent} disabled={isPending}>
              Set live
            </Button>
          )}
        </div>
      </CardHeader>
      {open && (
        <CardContent>
          <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/40 p-3 font-mono text-xs">
            {row.promptText}
          </pre>
        </CardContent>
      )}
    </Card>
  );
}
