'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { setVaActive } from '@/app/actions/admin';
import { Button } from '@/components/ui/button';

export function VaActiveToggle({ vaId, isActive }: { vaId: string; isActive: boolean }) {
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const res = await setVaActive(vaId, !isActive);
      if ('error' in res) toast.error(res.error);
      else toast.success(isActive ? 'VA deactivated' : 'VA activated');
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={toggle} disabled={isPending}>
      {isActive ? 'Deactivate' : 'Activate'}
    </Button>
  );
}
