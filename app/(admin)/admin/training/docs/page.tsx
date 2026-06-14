import Link from 'next/link';
import { db } from '@/db';
import { aiTrainingDocs } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { DocsManager, type DocRow } from './docs-manager';

export const dynamic = 'force-dynamic';

export default async function TrainingDocsPage() {
  const rows = await db
    .select()
    .from(aiTrainingDocs)
    .orderBy(desc(aiTrainingDocs.isActive), desc(aiTrainingDocs.createdAt));

  const items: DocRow[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    fileUrl: r.fileUrl,
    chunkCount: Array.isArray(r.chunks) ? r.chunks.length : 0,
    preview: (r.parsedText ?? '').slice(0, 280),
    isActive: r.isActive,
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/training" className="text-sm text-muted-foreground hover:underline">
          ← Back to training
        </Link>
        <h1 className="mt-2 font-serif text-3xl">Reference docs</h1>
        <p className="text-sm text-muted-foreground">
          Background the writer can pull a paragraph from for extra context. Paste text with blank
          lines between paragraphs; each paragraph becomes a retrievable chunk.
        </p>
      </div>

      <DocsManager items={items} />
    </div>
  );
}
