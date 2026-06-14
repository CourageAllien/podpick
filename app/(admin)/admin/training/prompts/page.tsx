import Link from 'next/link';
import { db } from '@/db';
import { aiPrompts, users } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PromptsManager, type PromptRow } from './prompts-manager';

export const dynamic = 'force-dynamic';

export default async function TrainingPromptsPage() {
  const rows = await db
    .select({
      id: aiPrompts.id,
      version: aiPrompts.version,
      step: aiPrompts.step,
      promptText: aiPrompts.promptText,
      changeNote: aiPrompts.changeNote,
      isCurrent: aiPrompts.isCurrent,
      createdAt: aiPrompts.createdAt,
      authorName: users.fullName,
    })
    .from(aiPrompts)
    .leftJoin(users, eq(aiPrompts.createdBy, users.id))
    .orderBy(desc(aiPrompts.version));

  const items: PromptRow[] = rows.map((r) => ({
    id: r.id,
    version: r.version,
    step: r.step as 'step1' | 'step2',
    promptText: r.promptText,
    changeNote: r.changeNote,
    isCurrent: r.isCurrent,
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
    authorName: r.authorName,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/training" className="text-sm text-muted-foreground hover:underline">
          ← Back to training
        </Link>
        <h1 className="mt-2 font-serif text-3xl">Base prompts</h1>
        <p className="text-sm text-muted-foreground">
          One prompt is live per step. Publishing a new version makes it current and demotes the
          previous one. The next pitch generated for that step uses the live version immediately.
        </p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">No prompts yet</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Seed the base prompts first, then tune them here.
          </CardContent>
        </Card>
      ) : (
        <PromptsManager items={items} />
      )}
    </div>
  );
}
