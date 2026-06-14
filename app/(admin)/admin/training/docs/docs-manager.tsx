'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createTrainingDoc, setDocActive } from '@/app/actions/training';

export type DocRow = {
  id: string;
  title: string;
  fileUrl: string;
  chunkCount: number;
  preview: string;
  isActive: boolean;
  createdAt: string | null;
};

export function DocsManager({ items }: { items: DocRow[] }) {
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={() => setCreating((v) => !v)}>
          {creating ? 'Cancel' : 'New doc'}
        </Button>
      </div>

      {creating && <DocForm onDone={() => setCreating(false)} />}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reference docs yet. Add the first one above.</p>
      ) : (
        items.map((row) => <DocCard key={row.id} row={row} />)
      )}
    </div>
  );
}

function DocCard({ row }: { row: DocRow }) {
  const [isPending, startTransition] = useTransition();

  function toggleActive() {
    startTransition(async () => {
      const res = await setDocActive(row.id, !row.isActive);
      if ('error' in res) {
        toast.error(res.error);
        return;
      }
      toast.success(row.isActive ? 'Deactivated' : 'Activated');
    });
  }

  return (
    <Card className={row.isActive ? '' : 'opacity-60'}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{row.title}</span>
            <Badge variant={row.isActive ? 'success' : 'muted'}>
              {row.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant="outline">{row.chunkCount} chunks</Badge>
          </div>
          {row.fileUrl && row.fileUrl !== 'pasted' && (
            <p className="mt-1 text-xs text-muted-foreground">{row.fileUrl}</p>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={toggleActive} disabled={isPending}>
          {row.isActive ? 'Deactivate' : 'Activate'}
        </Button>
      </CardHeader>
      {row.preview && (
        <CardContent>
          <p className="text-sm text-muted-foreground">{row.preview}…</p>
        </CardContent>
      )}
    </Card>
  );
}

function DocForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [text, setText] = useState('');
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createTrainingDoc({ title, sourceUrl, text });
      if ('error' in res) {
        toast.error(res.error);
        return;
      }
      toast.success('Doc added');
      onDone();
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">New reference doc</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doc-title">Title</Label>
            <Input
              id="doc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Positioning notes for fintech founders"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc-url">Source link (optional)</Label>
            <Input
              id="doc-url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doc-text">Text</Label>
            <Textarea
              id="doc-text"
              rows={10}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste reference text. Separate paragraphs with a blank line; each becomes a chunk."
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : 'Add doc'}
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
