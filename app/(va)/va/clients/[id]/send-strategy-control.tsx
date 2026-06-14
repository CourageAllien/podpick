'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { setManualOverride } from '@/app/actions/send-strategy';

export function SendStrategyControl({
  clientProfileId,
  initialOverride,
  cadence,
  warmupMode,
}: {
  clientProfileId: string;
  initialOverride: boolean;
  cadence: number[];
  warmupMode: boolean;
}) {
  const [override, setOverride] = useState(initialOverride);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !override;
    startTransition(async () => {
      const res = await setManualOverride(clientProfileId, next);
      if ('error' in res) {
        toast.error(res.error);
        return;
      }
      setOverride(next);
      toast.success(next ? 'Manual override on. Auto-planner paused.' : 'Auto-planner resumed.');
    });
  }

  return (
    <div className="space-y-3 text-sm">
      <p>
        Cadence: <span className="font-medium">{cadence.join('-')}</span> across weeks 1 to 4.
        {warmupMode && (
          <>
            {' '}
            <Badge variant="secondary">Warmup</Badge>
          </>
        )}
      </p>
      <div className="flex items-center gap-3">
        <Badge variant={override ? 'default' : 'muted'}>
          {override ? 'Manual override on' : 'Auto-planning'}
        </Badge>
        <Button size="sm" variant="outline" onClick={toggle} disabled={isPending}>
          {override ? 'Resume auto-planning' : 'Take manual control'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        With manual override on, the Monday planner stops generating slots for this period so you can
        curate the calendar by hand.
      </p>
    </div>
  );
}
