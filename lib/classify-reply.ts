import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = 'claude-sonnet-4-5';

export type ReplyClassification =
  | 'positive'
  | 'soft_no'
  | 'hard_no'
  | 'auto_reply'
  | 'question'
  | 'booking_inquiry'
  | 'other';

export type ClassifyReplyResult = {
  classification: ReplyClassification;
  confidence: number; // 0-1
  reasoning: string;
};

const VALID: ReplyClassification[] = [
  'positive',
  'soft_no',
  'hard_no',
  'auto_reply',
  'question',
  'booking_inquiry',
  'other',
];

/**
 * Classify a host's reply to a pitch. This is the gate that routes a reply into
 * the right workflow: only `positive` and `booking_inquiry` open a hot-lead
 * lifecycle (a human-reviewed booking path), so we bias toward NOT over-calling
 * positive. Auto-replies and hard nos must be filtered out cleanly so a VA never
 * drafts a celebratory response to an out-of-office bounce.
 *
 * Definitions:
 * - positive: genuine interest in having the guest on (yes / let's talk / send more)
 * - booking_inquiry: ready to schedule — asking for times, calendar, logistics
 * - question: engaged but needs info before deciding (not yet a yes)
 * - soft_no: not now / maybe later / not a fit right now, politely
 * - hard_no: clear decline, unsubscribe, "stop emailing"
 * - auto_reply: out-of-office, vacation responder, mailer-daemon, no-reply bounce
 * - other: anything that doesn't fit (forwarded internally, unrelated, spam)
 */
export async function classifyReply(input: {
  subject: string | null;
  body: string | null;
  fromEmail: string;
}): Promise<ClassifyReplyResult> {
  const subject = (input.subject ?? '').slice(0, 300);
  const body = (input.body ?? '').slice(0, 4000);

  const prompt = `You classify replies that podcast hosts send back to a guest-booking pitch. Return exactly one category.

CATEGORIES:
- positive: genuine interest in hosting the guest (yes, I'd love to, let's talk, send more info because I'm interested)
- booking_inquiry: ready to schedule — asking for availability, a calendar link, or recording logistics
- question: engaged but needs more information before deciding; not yet a yes
- soft_no: polite decline for now / not a fit right now / maybe later
- hard_no: firm decline, "remove me", unsubscribe, "stop emailing me"
- auto_reply: out-of-office / vacation autoresponder / delivery-failure or mailer-daemon bounce / no-reply system message
- other: doesn't fit any of the above

Bias rules:
- Do NOT label something positive unless there is real interest. Vague politeness is soft_no.
- Any out-of-office or automated bounce is auto_reply, regardless of wording.

FROM: ${input.fromEmail}
SUBJECT: ${subject}
BODY:
${body}

Return ONLY JSON, no commentary:
{ "classification": "<category>", "confidence": <0-1>, "reasoning": "<one short sentence>" }`;

  let parsed: ClassifyReplyResult;
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });
    const textBlock = response.content.find((b) => b.type === 'text');
    const text = textBlock && textBlock.type === 'text' ? textBlock.text : '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('no json');
    const raw = JSON.parse(match[0]);
    const classification = VALID.includes(raw.classification) ? raw.classification : 'other';
    parsed = {
      classification,
      confidence: typeof raw.confidence === 'number' ? Math.max(0, Math.min(1, raw.confidence)) : 0.5,
      reasoning: typeof raw.reasoning === 'string' ? raw.reasoning : '',
    };
  } catch {
    // Fail safe: never auto-celebrate. Route ambiguous replies to a human as 'other'.
    parsed = { classification: 'other', confidence: 0, reasoning: 'classifier_failed' };
  }

  return parsed;
}
