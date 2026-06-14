import Link from 'next/link';
import { db } from '@/db';
import { aiPrompts, aiFrameworks, aiTrainingDocs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function TrainingHomePage() {
  const [prompts, frameworks, docs] = await Promise.all([
    db.select({ id: aiPrompts.id, isCurrent: aiPrompts.isCurrent }).from(aiPrompts),
    db.select({ id: aiFrameworks.id, isActive: aiFrameworks.isActive }).from(aiFrameworks),
    db.select({ id: aiTrainingDocs.id, isActive: aiTrainingDocs.isActive }).from(aiTrainingDocs),
  ]);

  const currentPrompts = prompts.filter((p) => p.isCurrent).length;
  const activeFrameworks = frameworks.filter((f) => f.isActive).length;
  const activeDocs = docs.filter((d) => d.isActive).length;

  const cards = [
    {
      href: '/admin/training/prompts',
      title: 'Base prompts',
      stat: `${currentPrompts} live · ${prompts.length} versions`,
      blurb: 'The step-aware writing instructions every pitch starts from. Publish a new version to change the house style; roll back any time.',
    },
    {
      href: '/admin/training/frameworks',
      title: 'Frameworks',
      stat: `${activeFrameworks} active · ${frameworks.length} total`,
      blurb: 'Short style exemplars that seed each pitch with structure and voice. Tuned for founders in the $300K to $2M range.',
    },
    {
      href: '/admin/training/docs',
      title: 'Reference docs',
      stat: `${activeDocs} active · ${docs.length} total`,
      blurb: 'Longer background the writer can pull a paragraph from for extra context. Paste research, positioning notes, or proof points.',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Training</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          What the pitch writer reads at generation time. Changes here take effect on the next
          pitch, with no deploy.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="block">
            <Card className="h-full transition-colors hover:border-terracotta">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{c.title}</CardTitle>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {c.stat}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{c.blurb}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
