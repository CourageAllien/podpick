'use server';

import { db } from '@/db';
import { intakeSubmissions } from '@/db/schema';
import { sendTransactionalEmail } from '@/lib/resend';
import { allFieldNames, intakeSections } from './questions';

type SubmitResult = { ok: true } | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Persist a public intake submission.
 *
 * Two independent sinks so a single backend hiccup never loses a lead:
 *   1. Email the compiled submission to the team (primary, always attempted).
 *   2. Best-effort insert into intake_submissions (when a real DB is wired).
 *
 * Success is returned if EITHER sink accepts the submission.
 */
export async function submitIntake(
  payload: Record<string, string>
): Promise<SubmitResult> {
  const answers: Record<string, string> = {};
  for (const name of allFieldNames) {
    const v = payload?.[name];
    if (typeof v === 'string' && v.trim()) answers[name] = v.trim();
  }

  const fullName = answers.fullName ?? '';
  const email = answers.email ?? '';

  if (!fullName) return { ok: false, error: 'Please add your name.' };
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Please add a valid email address.' };
  if (!answers.oneLineBio) return { ok: false, error: 'Please tell us, in one line, what you do.' };
  if (!answers.topics) return { ok: false, error: 'Please list a few topics you can speak on.' };
  if (!answers.targetAudience) return { ok: false, error: 'Please describe your ideal audience.' };

  // 1. Email the team (primary).
  let emailed = false;
  try {
    const notify = process.env.INTAKE_NOTIFY_EMAIL || process.env.RESEND_FROM_EMAIL;
    if (notify) {
      const res = await sendTransactionalEmail({
        to: notify,
        subject: `New intake: ${fullName}${answers.company ? ` (${answers.company})` : ''}`,
        body: formatForEmail(answers),
        replyTo: email,
      });
      emailed = res.sent;
      if (!res.sent) console.error('[intake] notify email not sent:', res.error);
    }
  } catch (err) {
    console.error('[intake] notify email threw (non-fatal)', err);
  }

  // 2. Best-effort DB insert (no-op when DATABASE_URL is a placeholder).
  let stored = false;
  try {
    await db.insert(intakeSubmissions).values({
      fullName,
      email,
      company: answers.company ?? null,
      website: answers.website ?? null,
      answers,
    });
    stored = true;
  } catch (err) {
    console.error('[intake] DB insert failed (non-fatal)', err);
  }

  if (!emailed && !stored) {
    return { ok: false, error: 'Something went wrong on our end. Please try again in a moment.' };
  }
  return { ok: true };
}

function formatForEmail(answers: Record<string, string>): string {
  const lines: string[] = ['New PodEngine intake submission.', ''];
  for (const section of intakeSections) {
    const sectionFields = section.fields.filter((f) => answers[f.name]);
    if (sectionFields.length === 0) continue;
    lines.push(`== ${section.title.toUpperCase()} ==`);
    for (const f of sectionFields) {
      lines.push(`${f.label}:`);
      lines.push(answers[f.name]);
      lines.push('');
    }
  }
  return lines.join('\n');
}
