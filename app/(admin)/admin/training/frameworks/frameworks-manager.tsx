'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  createFramework,
  updateFramework,
  setFrameworkActive,
} from '@/app/actions/training';

type Step = 'step1' | 'step2' | 'either';
type Tone = 'professional' | 'casual' | 'sharp';

export type FrameworkRow = {
  id: string;
  label: string;
  body: string;
  step: Step;
  tone: Tone;
  useCases: string[];
  weight: number;
  isActive: boolean;
};

const STEP_LABEL: Record<Step, string> = {
  step1: 'Step 1',
  step2: 'Step 2',
  either: 'Either step',
};

export function FrameworksManager({ items }: { items: FrameworkRow[] }) {
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => setCreating((v) => !v)}>
          {creating ? 'Cancel' : 'New framework'}
        </Button>
      </div>

      {creating && (
        <FrameworkForm
          mode="create"
          onDone={() => setCreating(false)}
        />
      )}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No frameworks yet. Add the first one above.</p>
      ) : (
        items.map((row) => <FrameworkCard key={row.id} row={row} />)
      )}
    </div>
  );
}

function FrameworkCard({ row }: { row: FrameworkRow }) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggleActive() {
    startTransition(async () => {
      const res = await setFrameworkActive(row.id, !row.isActive);
      if ('error' in res) {
        toast.error(res.error);
        return;
      }
      toast.success(row.isActive ? 'Deactivated' : 'Activated');
    });
  }

  if (editing) {
    return <FrameworkForm mode="edit" row={row} onDone={() => setEditing(false)} />;
  }

  return (
    <Card className={row.isActive ? '' : 'opacity-60'}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{row.label}</span>
            <Badge variant={row.isActive ? 'success' : 'muted'}>
              {row.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant="secondary">{STEP_LABEL[row.step]}</Badge>
            <Badge variant="outline">{row.tone}</Badge>
            <Badge variant="outline">weight {row.weight}</Badge>
          </div>
          {row.useCases.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">{row.useCases.join(' · ')}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Button size="sm" variant="outline" onClick={toggleActive} disabled={isPending}>
            {row.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-line text-sm text-stone-700">{row.body}</p>
      </CardContent>
    </Card>
  );
}

function FrameworkForm({
  mode,
  row,
  onDone,
}: {
  mode: 'create' | 'edit';
  row?: FrameworkRow;
  onDone: () => void;
}) {
  const [label, setLabel] = useState(row?.label ?? '');
  const [body, setBody] = useState(row?.body ?? '');
  const [step, setStep] = useState<Step>(row?.step ?? 'either');
  const [tone, setTone] = useState<Tone>(row?.tone ?? 'professional');
  const [useCases, setUseCases] = useState((row?.useCases ?? []).join(', '));
  const [weight, setWeight] = useState(String(row?.weight ?? 1));
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const payload = {
        label,
        body,
        step,
        tone,
        useCases,
        weight: Number(weight) || 1,
      };
      const res =
        mode === 'create'
          ? await createFramework(payload)
          : await updateFramework({ id: row!.id, ...payload });
      if ('error' in res) {
        toast.error(res.error);
        return;
      }
      toast.success(mode === 'create' ? 'Framework added' : 'Framework updated');
      onDone();
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {mode === 'create' ? 'New framework' : `Edit: ${row?.label}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fw-label">Label</Label>
            <Input
              id="fw-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Contrarian data point opener"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fw-body">Body</Label>
            <Textarea
              id="fw-body"
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="A short exemplar that shows the structure and voice to inspire."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="fw-step">Step</Label>
              <select
                id="fw-step"
                value={step}
                onChange={(e) => setStep(e.target.value as Step)}
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="either">Either step</option>
                <option value="step1">Step 1</option>
                <option value="step2">Step 2</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fw-tone">Tone</Label>
              <select
                id="fw-tone"
                value={tone}
                onChange={(e) => setTone(e.target.value as Tone)}
                className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="sharp">Sharp</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fw-weight">Weight (1-10)</Label>
              <Input
                id="fw-weight"
                type="number"
                min={1}
                max={10}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fw-usecases">Use cases (comma-separated)</Label>
            <Input
              id="fw-usecases"
              value={useCases}
              onChange={(e) => setUseCases(e.target.value)}
              placeholder="cold open, proof point, founder story"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : mode === 'create' ? 'Add framework' : 'Save changes'}
            </Button>
            <Button type="button" variant="ghost" onClick={onDone} disabled={isPending}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
