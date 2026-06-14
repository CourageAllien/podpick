'use server';

import { revalidatePath } from 'next/cache';
import { and, desc, eq, ne } from 'drizzle-orm';
import { db } from '@/db';
import { aiPrompts, aiFrameworks, aiTrainingDocs } from '@/db/schema';
import { getCurrentUser } from '@/lib/auth';

/**
 * Admin-only training actions. The pitch writer reads prompts, frameworks, and
 * reference docs live from the DB (ai_prompts.is_current, ai_frameworks.is_active,
 * ai_training_docs.is_active), so these actions are how an admin tunes generation
 * without a code deploy. Every action re-checks the admin role server-side.
 *
 * Note: the seed constant files under lib/prompts/* are immutable bootstrap copy.
 * We never write to them here; new versions live as new rows in ai_prompts.
 */

async function requireAdmin() {
  const me = await getCurrentUser();
  if (!me || me.role !== 'admin') throw new Error('Not authorized');
  return me;
}

type ActionResult = { ok: true } | { error: string };

type Step = 'step1' | 'step2';
type FrameworkStep = 'step1' | 'step2' | 'either';
type Tone = 'professional' | 'casual' | 'sharp';

// ───────────────────────────────────────────────────────────────
// PROMPTS
// ───────────────────────────────────────────────────────────────

/**
 * Publish a new base-prompt version for a step. Versions are globally unique and
 * monotonic; the new row becomes the current prompt for its step and demotes the
 * previous current for that step. Prior versions stay as history.
 */
export async function createPromptVersion(input: {
  step: Step;
  promptText: string;
  changeNote: string;
}): Promise<ActionResult> {
  const me = await requireAdmin();

  const promptText = input.promptText.trim();
  const changeNote = input.changeNote.trim();
  if (promptText.length < 40) return { error: 'Prompt text looks too short to publish.' };
  if (!changeNote) return { error: 'Add a short change note so the history is readable.' };

  const [latest] = await db
    .select({ version: aiPrompts.version })
    .from(aiPrompts)
    .orderBy(desc(aiPrompts.version))
    .limit(1);
  const nextVersion = (latest?.version ?? 0) + 1;

  await db.transaction(async (tx) => {
    // Demote the current prompt for this step.
    await tx
      .update(aiPrompts)
      .set({ isCurrent: false })
      .where(and(eq(aiPrompts.step, input.step), eq(aiPrompts.isCurrent, true)));

    await tx.insert(aiPrompts).values({
      version: nextVersion,
      step: input.step,
      promptText,
      changeNote,
      createdBy: me.id,
      isCurrent: true,
    });
  });

  revalidatePath('/admin/training/prompts');
  return { ok: true };
}

/** Roll back / forward by making an existing version current for its step. */
export async function setCurrentPrompt(promptId: string): Promise<ActionResult> {
  await requireAdmin();

  const target = await db.query.aiPrompts.findFirst({ where: eq(aiPrompts.id, promptId) });
  if (!target) return { error: 'That prompt version no longer exists.' };

  await db.transaction(async (tx) => {
    await tx
      .update(aiPrompts)
      .set({ isCurrent: false })
      .where(and(eq(aiPrompts.step, target.step), ne(aiPrompts.id, promptId)));
    await tx.update(aiPrompts).set({ isCurrent: true }).where(eq(aiPrompts.id, promptId));
  });

  revalidatePath('/admin/training/prompts');
  return { ok: true };
}

// ───────────────────────────────────────────────────────────────
// FRAMEWORKS
// ───────────────────────────────────────────────────────────────

function parseUseCases(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function createFramework(input: {
  label: string;
  body: string;
  step: FrameworkStep;
  tone: Tone;
  useCases: string;
  weight: number;
}): Promise<ActionResult> {
  const me = await requireAdmin();

  const label = input.label.trim();
  const body = input.body.trim();
  if (!label) return { error: 'Give the framework a label.' };
  if (body.length < 20) return { error: 'Framework body looks too short.' };

  const weight = Number.isFinite(input.weight) ? Math.min(10, Math.max(1, Math.round(input.weight))) : 1;

  await db.insert(aiFrameworks).values({
    label,
    body,
    step: input.step,
    tone: input.tone,
    useCases: parseUseCases(input.useCases),
    weight,
    isActive: true,
    createdBy: me.id,
  });

  revalidatePath('/admin/training/frameworks');
  return { ok: true };
}

export async function updateFramework(input: {
  id: string;
  label: string;
  body: string;
  step: FrameworkStep;
  tone: Tone;
  useCases: string;
  weight: number;
}): Promise<ActionResult> {
  await requireAdmin();

  const label = input.label.trim();
  const body = input.body.trim();
  if (!label) return { error: 'Give the framework a label.' };
  if (body.length < 20) return { error: 'Framework body looks too short.' };

  const weight = Number.isFinite(input.weight) ? Math.min(10, Math.max(1, Math.round(input.weight))) : 1;

  await db
    .update(aiFrameworks)
    .set({
      label,
      body,
      step: input.step,
      tone: input.tone,
      useCases: parseUseCases(input.useCases),
      weight,
      updatedAt: new Date(),
    })
    .where(eq(aiFrameworks.id, input.id));

  revalidatePath('/admin/training/frameworks');
  return { ok: true };
}

export async function setFrameworkActive(id: string, isActive: boolean): Promise<ActionResult> {
  await requireAdmin();
  await db
    .update(aiFrameworks)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(aiFrameworks.id, id));
  revalidatePath('/admin/training/frameworks');
  return { ok: true };
}

// ───────────────────────────────────────────────────────────────
// TRAINING DOCS
// ───────────────────────────────────────────────────────────────

/** Split pasted reference text into paragraph-sized chunks for retrieval. */
function chunkText(text: string): Array<{ text: string }> {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 40)
    .map((p) => ({ text: p }));
}

export async function createTrainingDoc(input: {
  title: string;
  sourceUrl: string;
  text: string;
}): Promise<ActionResult> {
  const me = await requireAdmin();

  const title = input.title.trim();
  const text = input.text.trim();
  if (!title) return { error: 'Give the doc a title.' };

  const chunks = chunkText(text);
  if (chunks.length === 0) {
    return { error: 'Paste some reference text (use blank lines between paragraphs).' };
  }

  await db.insert(aiTrainingDocs).values({
    title,
    fileUrl: input.sourceUrl.trim() || 'pasted',
    parsedText: text,
    chunks,
    isActive: true,
    createdBy: me.id,
  });

  revalidatePath('/admin/training/docs');
  return { ok: true };
}

export async function setDocActive(id: string, isActive: boolean): Promise<ActionResult> {
  await requireAdmin();
  await db.update(aiTrainingDocs).set({ isActive }).where(eq(aiTrainingDocs.id, id));
  revalidatePath('/admin/training/docs');
  return { ok: true };
}
