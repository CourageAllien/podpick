/**
 * PodPick — seed script (idempotent)
 *
 * Run: pnpm db:seed
 *
 * Inserts:
 *  - the admin user (SEED_ADMIN_EMAIL / SEED_ADMIN_NAME)
 *  - step-1 and step-2 base prompts (both is_current=true, one per step)
 *  - the 9 SaaS frameworks
 *
 * Safe to re-run: every insert guards on a unique constraint.
 */

import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { users, aiPrompts, aiFrameworks } from '@/db/schema';
import {
  BASE_PROMPT_V2_STEP1,
  BASE_PROMPT_V2_STEP1_CHANGE_NOTE,
} from '@/lib/prompts/base-prompt-v2-step1';
import {
  BASE_PROMPT_V2_STEP2,
  BASE_PROMPT_V2_STEP2_CHANGE_NOTE,
} from '@/lib/prompts/base-prompt-v2-step2';
import { SAAS_FRAMEWORK_SEEDS } from '@/lib/prompts/framework-examples-saas';

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminName = process.env.SEED_ADMIN_NAME || 'Admin';
  if (!adminEmail) throw new Error('SEED_ADMIN_EMAIL is required to seed');

  // 1. Admin user
  await db
    .insert(users)
    .values({ email: adminEmail, fullName: adminName, role: 'admin' })
    .onConflictDoNothing({ target: users.email });

  const admin = await db.query.users.findFirst({ where: eq(users.email, adminEmail) });
  const createdBy = admin?.id ?? null;
  console.log(`Admin user ready: ${adminEmail}`);

  // 2. Base prompts — one current per step
  await db
    .insert(aiPrompts)
    .values([
      {
        version: 1,
        step: 'step1',
        promptText: BASE_PROMPT_V2_STEP1,
        changeNote: BASE_PROMPT_V2_STEP1_CHANGE_NOTE,
        isCurrent: true,
        createdBy,
      },
      {
        version: 2,
        step: 'step2',
        promptText: BASE_PROMPT_V2_STEP2,
        changeNote: BASE_PROMPT_V2_STEP2_CHANGE_NOTE,
        isCurrent: true,
        createdBy,
      },
    ])
    .onConflictDoNothing({ target: aiPrompts.version });
  console.log('Base prompts (step1 + step2) seeded.');

  // 3. Frameworks
  let inserted = 0;
  for (const f of SAAS_FRAMEWORK_SEEDS) {
    const exists = await db.query.aiFrameworks.findFirst({
      where: eq(aiFrameworks.label, f.label),
    });
    if (exists) continue;
    await db.insert(aiFrameworks).values({
      label: f.label,
      body: f.body,
      step: f.step,
      tone: f.tone,
      useCases: f.useCases,
      weight: f.weight,
      isActive: true,
      createdBy,
    });
    inserted++;
  }
  console.log(`Frameworks seeded: ${inserted} new (${SAAS_FRAMEWORK_SEEDS.length} total).`);

  console.log('Seed complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
