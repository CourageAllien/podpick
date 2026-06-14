'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { createVa } from '@/app/actions/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CreateVaForm() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await createVa({ fullName, email });
      if ('error' in res) {
        toast.error(res.error);
        return;
      }
      toast.success(`${fullName} added. They can sign in with a magic link.`);
      setFullName('');
      setEmail('');
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="va-name">Full name</Label>
        <Input
          id="va-name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jordan Rivera"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="va-email">Email</Label>
        <Input
          id="va-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jordan@podengine.com"
        />
      </div>
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Adding...' : 'Add VA'}
      </Button>
      <p className="text-xs text-muted-foreground">
        They sign in with a one-time link at the same login page. No password needed.
      </p>
    </form>
  );
}
