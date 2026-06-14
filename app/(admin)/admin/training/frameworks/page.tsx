import Link from 'next/link';
import { db } from '@/db';
import { aiFrameworks } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { FrameworksManager, type FrameworkRow } from './frameworks-manager';

export const dynamic = 'force-dynamic';

export default async function TrainingFrameworksPage() {
  const rows = await db
    .select()
    .from(aiFrameworks)
    .orderBy(desc(aiFrameworks.isActive), desc(aiFrameworks.createdAt));

  const items: FrameworkRow[] = rows.map((r) => ({
    id: r.id,
    label: r.label,
    body: r.body,
    step: r.step as 'step1' | 'step2' | 'either',
    tone: r.tone as 'professional' | 'casual' | 'sharp',
    useCases: r.useCases ?? [],
    weight: r.weight,
    isActive: r.isActive,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/training" className="text-sm text-muted-foreground hover:underline">
          ← Back to training
        </Link>
        <h1 className="mt-2 font-serif text-3xl">Frameworks</h1>
        <p className="text-sm text-muted-foreground">
          Style exemplars the writer samples from per pitch. Higher weight means a framework is
          picked more often. Only active frameworks are ever used.
        </p>
      </div>

      <FrameworksManager items={items} />
    </div>
  );
}
