import Anthropic from '@anthropic-ai/sdk';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { responses, pitches, clientProfiles, podcasts, users } from '@/db/schema';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL = 'claude-sonnet-4-5';

export type ReplyIntent = 'send_one_pager' | 'address_question' | 'redirect_topic';

export type DraftPositiveReplyResult =
  | { error: string }
  | {
      responseId: string;
      lifecycleId: string | null;
      clientProfileId: string;
      clientEmail: string;
      hostEmail: string;
      podcastTitle: string;
      draftSubject: string;
      draftBody: string;
      mediaPageUrl: string;
      calendarLink: string | null;
      clientActionRequired: string;
    };

/**
 * Generates the response a client should send back to a host who replied
 * positively. This is the most consequential drafting step in the product: the
 * draft is the message that turns interest into a booking. It is written in the
 * client's first-person voice, warm and concise, points the host to the media
 * page and calendar, and never invents facts about the client.
 *
 * Shared by the agent's draft_positive_reply tool and the VA dashboard action so
 * both paths produce identical drafts and persist them the same way.
 */
export async function buildPositiveReplyDraft(input: {
  responseId: string;
  intent?: ReplyIntent;
}): Promise<DraftPositiveReplyResult> {
  const intent = input.intent ?? 'send_one_pager';

  const response = await db.query.responses.findFirst({
    where: eq(responses.id, input.responseId),
  });
  if (!response) return { error: 'Response not found.' };

  const pitch = await db.query.pitches.findFirst({ where: eq(pitches.id, response.pitchId) });
  if (!pitch) return { error: 'Pitch for this response not found.' };

  const client = await db.query.clientProfiles.findFirst({
    where: eq(clientProfiles.id, pitch.clientProfileId),
  });
  if (!client) return { error: 'Client profile not found.' };

  const podcast = await db.query.podcasts.findFirst({ where: eq(podcasts.id, pitch.podcastId) });
  const user = await db.query.users.findFirst({ where: eq(users.id, client.userId) });

  const clientFirstName = (user?.fullName ?? '').split(' ')[0] || client.company || 'there';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.podpick.com';
  const mediaPageUrl = `${appUrl}/m/${client.slug}`;
  const calendarLink = client.bookingLink ?? null;

  const intentGuidance: Record<ReplyIntent, string> = {
    send_one_pager:
      'The host is interested. Thank them warmly, confirm the client would love to come on, and give them the easy next step: the media page (for background) and the calendar link (to grab a time).',
    address_question:
      "The host asked a question. Answer it directly and honestly from the client's bio and angles, then nudge toward scheduling with the calendar link. Do not invent facts not supported by the client's profile.",
    redirect_topic:
      'The host floated a topic or angle. Acknowledge it, connect it to one of the client\'s real angles, and move toward scheduling with the calendar link.',
  };

  const prompt = `You are drafting a reply that ${clientFirstName} (a SaaS founder) will send back to a podcast host who responded to a guest pitch. Write in ${clientFirstName}'s first-person voice. Warm, concise, genuine. This reply should make it easy for the host to move forward.

${intentGuidance[intent]}

CLIENT:
- Name: ${user?.fullName ?? client.company ?? 'the founder'}
- Company: ${client.company ?? ''}
- One-line: ${client.oneLineBio ?? ''}
- Bio: ${client.longBio ?? client.oneLineBio ?? ''}
- Angles: ${(client.angles ?? []).map((a) => a.title).join('; ')}

PODCAST: ${podcast?.title ?? 'the show'} (host: ${podcast?.hostName ?? 'the host'})

HOST'S REPLY:
Subject: ${response.subject ?? ''}
${(response.body ?? '').slice(0, 2000)}

RESOURCES TO INCLUDE NATURALLY:
- Media page: ${mediaPageUrl}
${calendarLink ? `- Calendar link: ${calendarLink}` : '- (No calendar link on file — invite them to suggest a few times instead.)'}

STRICT RULES:
- 70-100 words in the body.
- First person, as the client. Never mention a VA, an assistant, or any tooling.
- Never use the word "AI". Never use em dashes.
- Do not fabricate achievements, metrics, or facts not in the client's profile.

Return ONLY JSON, no commentary:
{ "subject": "<usually empty for an in-thread reply>", "body": "<the reply>" }`;

  let draftSubject = '';
  let draftBody = '';
  try {
    const result = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    });
    const textBlock = result.content.find((b) => b.type === 'text');
    const text = textBlock && textBlock.type === 'text' ? textBlock.text : '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return { error: 'Draft model returned no parseable output.' };
    const parsed = JSON.parse(match[0]);
    draftSubject = typeof parsed.subject === 'string' ? parsed.subject : '';
    draftBody = typeof parsed.body === 'string' ? parsed.body.trim() : '';
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'draft_generation_failed' };
  }

  if (!draftBody) return { error: 'Draft model returned an empty body.' };

  return {
    responseId: response.id,
    lifecycleId: null,
    clientProfileId: client.id,
    clientEmail: user?.email ?? '',
    hostEmail: response.fromEmail,
    podcastTitle: podcast?.title ?? 'the show',
    draftSubject,
    draftBody,
    mediaPageUrl,
    calendarLink,
    clientActionRequired: 'Review the draft, edit if needed, and send it from your own inbox.',
  };
}
