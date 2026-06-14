/**
 * PodPick — AI writer v3 with step-aware generation
 *
 * v3 changes from v2:
 *  - `step` parameter required (step1 or step2)
 *  - Loads step-specific base prompt (filtered by ai_prompts.step)
 *  - Pulls step-tagged frameworks (ai_frameworks.step matches OR 'either')
 *  - Step 2 requires hostPersonalContext input
 *  - Step 2 allows slightly longer body (110 vs 90 words for step1)
 *  - All generations log step in ai_generations
 */

import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/db';
import { aiPrompts, aiFrameworks, aiTrainingDocs, aiGenerations } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = 'claude-sonnet-4-5';

export type Step = 'step1' | 'step2';

export type GenerationInput = {
  pitchId: string;
  step: Step;

  // Client context (both steps)
  clientName: string;
  clientTitle: string;
  clientCompany: string;
  clientBio: string;
  clientAngle: { title: string; description: string };
  clientAudience: string;

  // Podcast context (both steps)
  podcastName: string;
  podcastHost: string;
  podcastDescription: string;

  // Step 1 — required: episode-based personalization
  episode?: { title: string; pubDate: string; summary: string };

  // Step 2 — required: host-based personalization
  hostPersonalContext?: {
    sourceType: 'linkedin_post' | 'substack' | 'interview' | 'article' | 'journey';
    url?: string;
    excerpt: string;            // The specific thing the host put out
    matchedClientStoryAnchor: string;  // Which chapter of the client's story applies
  };

  tone?: 'professional' | 'casual' | 'sharp';
  length?: 'short' | 'medium' | 'long';
};

export type GenerationOutput = {
  subject: string;
  body: string;
  step: Step;
  promptVersion: number;
  frameworksUsed: string[];
  docsUsed: string[];
  model: string;
};

const LENGTH_HINT_STEP1 = {
  short: 'Target: 60-75 words body. Step 1 max 90.',
  medium: 'Target: 75-85 words body. Step 1 max 90.',
  long: 'Target: 80-90 words body. Step 1 max 90.',
};

const LENGTH_HINT_STEP2 = {
  short: 'Target: 80-95 words body. Step 2 max 110.',
  medium: 'Target: 90-100 words body. Step 2 max 110.',
  long: 'Target: 95-110 words body. Step 2 max 110.',
};

// ───────────────────────────────────────────────────────────────
// MAIN ENTRYPOINT
// ───────────────────────────────────────────────────────────────

export async function generatePitch(input: GenerationInput): Promise<GenerationOutput> {
  // Validate step-specific required inputs
  if (input.step === 'step1' && !input.episode) {
    throw new Error('GenerationInput: step1 requires episode field');
  }
  if (input.step === 'step2' && !input.hostPersonalContext) {
    throw new Error('GenerationInput: step2 requires hostPersonalContext field');
  }

  const basePrompt = await loadCurrentPrompt(input.step);
  const frameworks = await pullFrameworks({
    step: input.step,
    tone: input.tone || 'professional',
    count: 1 + Math.floor(Math.random() * 2),
  });
  const docChunk = Math.random() > 0.5 ? await pullDocChunk() : null;

  const fullPrompt = buildFullPrompt({
    base: basePrompt.promptText,
    input,
    frameworks: frameworks.map((f) => ({ label: f.label, body: f.body })),
    docChunk: docChunk?.text,
  });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: fullPrompt }],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Could not parse JSON output');
  }

  const parsed: { subject?: string; body?: string } = JSON.parse(jsonMatch[0]);
  if (!parsed.subject || !parsed.body) {
    throw new Error('Output missing subject or body');
  }

  validateOutput(parsed.subject, parsed.body, input.step);

  await db.insert(aiGenerations).values({
    pitchId: input.pitchId,
    promptVersion: basePrompt.version,
    step: input.step,
    frameworksUsed: frameworks.map((f) => f.label),
    docsUsed: docChunk ? [docChunk.docId] : [],
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    costCents: estimateCostCents(response.usage),
  });

  return {
    subject: parsed.subject,
    body: parsed.body,
    step: input.step,
    promptVersion: basePrompt.version,
    frameworksUsed: frameworks.map((f) => f.label),
    docsUsed: docChunk ? [docChunk.docId] : [],
    model: MODEL,
  };
}

// ───────────────────────────────────────────────────────────────
// HELPERS
// ───────────────────────────────────────────────────────────────

async function loadCurrentPrompt(step: Step) {
  const current = await db.query.aiPrompts.findFirst({
    where: and(eq(aiPrompts.isCurrent, true), eq(aiPrompts.step, step)),
  });
  if (!current) {
    throw new Error(
      `No current AI prompt set for ${step}. Admin must seed via /admin/training/prompts.`
    );
  }
  return current;
}

async function pullFrameworks(params: {
  step: Step;
  tone: 'professional' | 'casual' | 'sharp';
  count: number;
}) {
  // Frameworks tagged for this step OR 'either'
  const active = await db.query.aiFrameworks.findMany({
    where: and(
      eq(aiFrameworks.isActive, true),
      or(eq(aiFrameworks.step, params.step), eq(aiFrameworks.step, 'either'))
    ),
  });

  if (active.length === 0) return [];

  const weighted = active.flatMap((f) => Array(f.weight || 1).fill(f));
  const chosen: typeof active = [];
  for (let i = 0; i < params.count && weighted.length > 0; i++) {
    const idx = Math.floor(Math.random() * weighted.length);
    const pick = weighted[idx];
    if (!chosen.find((c) => c.id === pick.id)) chosen.push(pick);
  }
  return chosen;
}

async function pullDocChunk(): Promise<{ text: string; docId: string } | null> {
  const docs = await db.query.aiTrainingDocs.findMany({
    where: eq(aiTrainingDocs.isActive, true),
  });
  if (docs.length === 0) return null;

  const doc = docs[Math.floor(Math.random() * docs.length)];
  const chunks = doc.chunks as Array<{ text: string }> | null;
  if (!chunks || chunks.length === 0) return null;

  const chunk = chunks[Math.floor(Math.random() * chunks.length)];
  return { text: chunk.text, docId: doc.id };
}

function buildFullPrompt(params: {
  base: string;
  input: GenerationInput;
  frameworks: Array<{ label: string; body: string }>;
  docChunk?: string;
}): string {
  const { base, input, frameworks, docChunk } = params;
  let prompt = base + '\n\n';

  // Client context
  prompt += `\n═══ THE PERSON YOU ARE WRITING AS ═══\n`;
  prompt += `Name: ${input.clientName}\n`;
  prompt += `Title: ${input.clientTitle}\n`;
  prompt += `Company: ${input.clientCompany}\n`;
  prompt += `Bio: ${input.clientBio}\n`;

  // Podcast context
  prompt += `\n═══ THE PODCAST ═══\n`;
  prompt += `Show: ${input.podcastName}\n`;
  prompt += `Host: ${input.podcastHost}\n`;
  prompt += `About: ${input.podcastDescription}\n`;

  // Step-specific personalization source
  if (input.step === 'step1' && input.episode) {
    prompt += `\n═══ THE EPISODE TO REFERENCE (Step 1) ═══\n`;
    prompt += `Title: ${input.episode.title}\n`;
    prompt += `Published: ${input.episode.pubDate}\n`;
    prompt += `Summary: ${input.episode.summary}\n`;
    prompt += `\nYour opener MUST reference a specific moment from this episode.\n`;
  } else if (input.step === 'step2' && input.hostPersonalContext) {
    prompt += `\n═══ THE HOST PERSONAL CONTEXT (Step 2) ═══\n`;
    prompt += `Source type: ${input.hostPersonalContext.sourceType}\n`;
    if (input.hostPersonalContext.url) {
      prompt += `URL: ${input.hostPersonalContext.url}\n`;
    }
    prompt += `What the host put out:\n"${input.hostPersonalContext.excerpt}"\n\n`;
    prompt += `Client's story chapter that applies:\n"${input.hostPersonalContext.matchedClientStoryAnchor}"\n`;
    prompt += `\nYour pitch MUST connect the host's personal angle (above) to this chapter of the client's story.\n`;
    prompt += `This is NOT an episode-based pitch. Do not reference recent episodes; reference the host's personal world.\n`;
  }

  // Angle + audience
  prompt += `\n═══ THE ANGLE TO MAKE ═══\n`;
  prompt += `${input.clientAngle.title}: ${input.clientAngle.description}\n`;
  prompt += `\n═══ WHO THE CLIENT WANTS TO REACH ═══\n`;
  prompt += `${input.clientAudience}\n`;

  // Frameworks
  if (frameworks.length > 0) {
    prompt += `\n═══ STYLE FRAMEWORKS TO INSPIRE THIS PITCH ═══\n`;
    prompt += `Don't copy these, but let them inform your structure and voice:\n\n`;
    frameworks.forEach((f, i) => {
      prompt += `Framework ${i + 1} — "${f.label}":\n${f.body}\n\n`;
    });
  }

  if (docChunk) {
    prompt += `\n═══ ADDITIONAL CONTEXT ═══\n${docChunk}\n`;
  }

  // Length hint per step
  const lengthHint = input.step === 'step1' ? LENGTH_HINT_STEP1 : LENGTH_HINT_STEP2;
  prompt += `\n═══ STYLE ═══\n`;
  prompt += `Tone: ${input.tone || 'professional'}\n`;
  prompt += `Length: ${lengthHint[input.length || 'medium']}\n`;

  // Hard rules (shared)
  prompt += `\n═══ ABSOLUTE RULES ═══\n`;
  prompt += `1. NEVER use em dashes. Use commas, periods, or colons.\n`;
  prompt += `2. NEVER open with a question.\n`;
  prompt += `3. NEVER use: "I love your podcast", "long-time listener", "I came across your show",\n`;
  prompt += `   "I wanted to reach out", "I hope this email finds you well", "Let me introduce myself".\n`;
  prompt += `4. End with ONE clear CTA: "Worth a future episode?", "Open to a conversation?",\n`;
  prompt += `   "Happy to send a one-pager."\n`;
  prompt += `5. Sign off: ${input.clientName}, ${input.clientTitle}, ${input.clientCompany}\n`;

  if (input.step === 'step1') {
    prompt += `6. Subject line: 5-10 words, references episode topic.\n`;
    prompt += `7. NO PS line required (optional, episode-related only).\n`;
  } else {
    prompt += `6. Subject line: 5-10 words, references something personal about the host (not the show).\n`;
    prompt += `7. NO PS line — the whole email is already personal.\n`;
  }

  prompt += `\n═══ OUTPUT ═══\n`;
  prompt += `Return only JSON with exactly two fields:\n`;
  prompt += `{\n  "subject": "...",\n  "body": "..."\n}\n`;
  prompt += `Use \\n for line breaks. No markdown. No commentary.\n`;

  return prompt;
}

function validateOutput(subject: string, body: string, step: Step): void {
  if (body.includes('—') || subject.includes('—')) {
    throw new Error('VALIDATION: pitch contains em dash');
  }

  const firstSentence = body.split(/[.!?]/)[0]?.trim().toLowerCase() ?? '';
  const questionStarters = ['have you', 'did you', 'do you', 'ever wondered', 'are you'];
  if (questionStarters.some((q) => firstSentence.startsWith(q))) {
    throw new Error('VALIDATION: pitch opens with a question');
  }

  const forbidden = [
    'i love your podcast', 'long-time listener', 'long time listener',
    'i came across your show', 'i wanted to reach out',
    'i hope this email finds you well', 'let me introduce myself',
    'touching base', 'circling back',
  ];
  const lowerBody = body.toLowerCase();
  for (const phrase of forbidden) {
    if (lowerBody.includes(phrase)) {
      throw new Error(`VALIDATION: contains forbidden phrase: "${phrase}"`);
    }
  }

  // Step-specific word limit
  const wordCount = body.trim().split(/\s+/).length;
  const maxWords = step === 'step1' ? 90 : 110;
  if (wordCount > maxWords) {
    throw new Error(`VALIDATION: ${step} body is ${wordCount} words (max ${maxWords})`);
  }
}

function estimateCostCents(usage: { input_tokens: number; output_tokens: number }): number {
  const inputCost = (usage.input_tokens / 1_000_000) * 300;
  const outputCost = (usage.output_tokens / 1_000_000) * 1500;
  return Math.ceil(inputCost + outputCost);
}
