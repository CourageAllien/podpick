'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { assignClient } from '@/app/actions/admin';

/**
 * Inline VA assignment dropdown. Optimistic: updates local value immediately,
 * reverts on server error. Empty value = unassigned.
 */
export function AssignVaSelect({
  clientProfileId,
  current,
  options,
}: {
  clientProfileId: string;
  current: string | null;
  options: { id: string; label: string }[];
}) {
  const [value, setValue] = useState(current ?? '');
  const [isPending, startTransition] = useTransition();

  function onChange(next: string) {
    const prev = value;
    setValue(next);
    startTransition(async () => {
      const res = await assignClient(clientProfileId, next || null);
      if ('error' in res) {
        setValue(prev);
        toast.error(res.error);
      } else {
        toast.success(next ? 'VA assigned' : 'Unassigned');
      }
    });
  }

  return (
    <select
      value={value}
      disabled={isPending}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border bg-background px-2 py-1 text-sm disabled:opacity-50"
    >
      <option value="">Unassigned</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
