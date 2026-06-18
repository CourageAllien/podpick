/**
 * Intake form schema — the single source of truth for the questions we ask a
 * new client, shared by the form UI and the server action.
 *
 * Everything here is designed to produce, from one submission:
 *   - a media kit + public media page (About, Topics, Questions to ask)
 *   - a short list of shows worth pitching, with real reasons
 *   - customized, on-brand pitches in the client's own voice
 *
 * Field `name`s are stable keys; they become the JSON keys in
 * intake_submissions.answers, so do not rename them casually.
 */

export type FieldType = 'text' | 'email' | 'tel' | 'url' | 'textarea' | 'select';

export interface IntakeField {
  name: string;
  label: string;
  help?: string;
  placeholder?: string;
  type: FieldType;
  required?: boolean;
  options?: string[]; // for select
}

export interface IntakeSection {
  id: string;
  title: string;
  blurb: string;
  fields: IntakeField[];
}

export const intakeSections: IntakeSection[] = [
  {
    id: 'about-you',
    title: 'About you',
    blurb: 'The basics, so we know who we are representing and how to reach you.',
    fields: [
      {
        name: 'fullName',
        label: 'Full name',
        type: 'text',
        required: true,
        placeholder: 'Jane Cooper',
      },
      {
        name: 'email',
        label: 'Best email',
        help: 'Where we send your media page, drafts, and updates.',
        type: 'email',
        required: true,
        placeholder: 'jane@company.com',
      },
      {
        name: 'phone',
        label: 'Phone or preferred contact (optional)',
        type: 'text',
        placeholder: 'Text, WhatsApp, etc.',
      },
      {
        name: 'company',
        label: 'Company or brand name',
        type: 'text',
        placeholder: 'Cooper & Co.',
      },
      {
        name: 'role',
        label: 'Your title or role',
        type: 'text',
        placeholder: 'Founder & CEO',
      },
      {
        name: 'location',
        label: 'City and time zone',
        help: 'Helps us schedule recordings hosts propose.',
        type: 'text',
        placeholder: 'Austin, TX (US Central)',
      },
      {
        name: 'pronouns',
        label: 'How should we refer to you?',
        help: 'So your bio and pitches use the right pronouns.',
        type: 'select',
        options: ['She / her', 'He / him', 'They / them', 'Use my name only'],
      },
    ],
  },
  {
    id: 'presence',
    title: 'Online presence & assets',
    blurb:
      'Links we will research for your media page and that hosts will check before booking. The more complete, the sharper the pitches.',
    fields: [
      {
        name: 'website',
        label: 'Website',
        type: 'url',
        placeholder: 'https://company.com',
      },
      {
        name: 'linkedinUrl',
        label: 'LinkedIn',
        type: 'url',
        placeholder: 'https://linkedin.com/in/...',
      },
      {
        name: 'twitterUrl',
        label: 'X / Twitter',
        type: 'url',
        placeholder: 'https://x.com/...',
      },
      {
        name: 'otherSocial',
        label: 'Instagram, YouTube, TikTok, or podcast',
        help: 'Anywhere you publish. List as many as you like.',
        type: 'textarea',
        placeholder: 'One link per line',
      },
      {
        name: 'pressLinks',
        label: 'Books, articles, or press features',
        help: 'Amazon author page, notable interviews, anything that builds credibility.',
        type: 'textarea',
        placeholder: 'One link per line',
      },
      {
        name: 'headshotUrl',
        label: 'Headshot & logo link',
        help: 'A shareable Google Drive or Dropbox folder with a high-res headshot (and logo, if you have one).',
        type: 'url',
        placeholder: 'https://drive.google.com/...',
      },
      {
        name: 'existingKit',
        label: 'Existing media kit or one-sheet (optional)',
        help: 'If you already have one, link it and we will build on it.',
        type: 'url',
        placeholder: 'https://...',
      },
    ],
  },
  {
    id: 'story',
    title: 'Your story & positioning',
    blurb:
      'This becomes the "About" on your media page and the credibility line in every pitch. Write the way you actually talk.',
    fields: [
      {
        name: 'oneLineBio',
        label: 'In one sentence, what do you do and for whom?',
        help: 'The way you would introduce yourself at a conference.',
        type: 'textarea',
        required: true,
        placeholder:
          'I help manufacturers grow on Amazon by running the channel like a real P&L.',
      },
      {
        name: 'longBio',
        label: 'A short bio (2 to 4 sentences)',
        help: 'Who you are, what you have built, why people listen.',
        type: 'textarea',
        placeholder: '',
      },
      {
        name: 'credentials',
        label: 'Credentials & proof',
        help: 'Titles, awards, hard numbers, notable clients, books, exits, years in the game. Specifics beat adjectives.',
        type: 'textarea',
        placeholder:
          '25 years in the electrical industry; MBA, Chicago Booth; scaled X to $YM; featured on ABC affiliate.',
      },
      {
        name: 'originStory',
        label: 'What led you here? Your origin story.',
        help: 'The human hook hosts love. The turning point, the struggle, the why.',
        type: 'textarea',
        placeholder: '',
      },
      {
        name: 'differentiator',
        label: 'What makes your perspective different?',
        help: 'Why you, and not the ten other experts in your space.',
        type: 'textarea',
        placeholder: '',
      },
    ],
  },
  {
    id: 'topics',
    title: 'Topics & angles',
    blurb:
      'The raw material for your "Topics" grid, the questions we suggest hosts ask, and the hook in every pitch.',
    fields: [
      {
        name: 'topics',
        label: 'Core topics you can speak on',
        help: 'List 3 to 6. These become your media-page topics.',
        type: 'textarea',
        required: true,
        placeholder:
          'One per line, e.g.\nProactive tax planning for owners\nBuilding a business to sell\nThe CPA as a growth partner',
      },
      {
        name: 'signatureIdea',
        label: 'The one idea you are known for',
        help: 'Your signature talk or thesis in a sentence.',
        type: 'textarea',
        placeholder: '',
      },
      {
        name: 'contrarianTake',
        label: 'A contrarian or surprising take you hold',
        help: 'The line that makes a host say "wait, say more." Great pitch fuel.',
        type: 'textarea',
        placeholder: 'Most owners only think about taxes in April, and it quietly costs them the most.',
      },
      {
        name: 'storiesAndData',
        label: 'Stories, case studies, or data you can share on air',
        help: 'Concrete moments and numbers make an interview memorable.',
        type: 'textarea',
        placeholder: '',
      },
      {
        name: 'favoriteQuestions',
        label: 'Questions you love being asked',
        help: 'We seed the host with these. One per line.',
        type: 'textarea',
        placeholder: '',
      },
      {
        name: 'avoidTopics',
        label: 'Topics or questions to avoid',
        help: 'Anything off-limits, legally sensitive, or just not your lane.',
        type: 'textarea',
        placeholder: '',
      },
    ],
  },
  {
    id: 'audience-goals',
    title: 'Audience & goals',
    blurb:
      'How we pick the right shows and what we point listeners toward. Be specific; "everyone" is not an audience.',
    fields: [
      {
        name: 'targetAudience',
        label: 'Who is your ideal listener / customer?',
        help: 'Role, industry, stage, the problem they have. The more specific, the better the show match.',
        type: 'textarea',
        required: true,
        placeholder:
          'Founders of $1M to $20M manufacturing businesses who find Amazon intimidating.',
      },
      {
        name: 'campaignGoal',
        label: 'What should this campaign achieve for you?',
        help: 'Pick the main outcome (you can add nuance below).',
        type: 'select',
        options: [
          'Build authority / personal brand',
          'Generate leads or sales',
          'Sell a book',
          'Promote a launch or event',
          'Grow an audience / following',
          'Recruiting / hiring',
          'Other (describe below)',
        ],
      },
      {
        name: 'goalDetail',
        label: 'Anything that adds nuance to that goal?',
        type: 'textarea',
        placeholder: 'New book out in September; want to fill the launch with appearances.',
      },
      {
        name: 'offer',
        label: 'What do you sell / what is your offer?',
        help: 'So we match you to audiences who would actually buy.',
        type: 'textarea',
        placeholder: '',
      },
      {
        name: 'callToAction',
        label: 'The action you want listeners to take, plus the link',
        help: 'Lead magnet, book, demo, free consult, newsletter. Include the exact URL.',
        type: 'textarea',
        placeholder: 'Download the free pre-sale checklist at company.com/checklist',
      },
    ],
  },
  {
    id: 'shows',
    title: 'Target shows',
    blurb:
      'Helps us aim. We will research beyond this, but your input sharpens the shortlist and keeps us from re-pitching shows you have done.',
    fields: [
      {
        name: 'dreamPodcasts',
        label: 'Dream podcasts you would love to be on',
        help: 'Names or links, one per line. Reach is fine here.',
        type: 'textarea',
        placeholder: '',
      },
      {
        name: 'podcastsYouListenTo',
        label: 'Podcasts you already listen to in your niche',
        help: 'Often the best-fit, realistic targets.',
        type: 'textarea',
        placeholder: '',
      },
      {
        name: 'pastAppearances',
        label: 'Podcasts you have already appeared on',
        help: 'Link episodes if you can. We use these as proof and avoid re-pitching them.',
        type: 'textarea',
        placeholder: '',
      },
      {
        name: 'peersToModel',
        label: 'Peers or competitors whose appearances we can model',
        help: 'Who in your space does great podcast guesting? We will study where they show up.',
        type: 'textarea',
        placeholder: '',
      },
      {
        name: 'showPreferences',
        label: 'Format and size preferences',
        help: 'Video vs audio, solo interview vs panel, big-and-broad vs small-and-niche.',
        type: 'textarea',
        placeholder: '',
      },
      {
        name: 'showsToAvoid',
        label: 'Shows, hosts, or topics to avoid',
        help: 'Competitors, anything off-brand, conflicts of interest.',
        type: 'textarea',
        placeholder: '',
      },
    ],
  },
  {
    id: 'voice-logistics',
    title: 'Voice & logistics',
    blurb:
      'So the pitches sound like you, send cleanly, and turn into booked recordings.',
    fields: [
      {
        name: 'voiceNotes',
        label: 'How should your pitches sound?',
        help: 'Warm, plain-spoken, punchy, formal? If you can, paste a few sentences you have written so we can match your voice.',
        type: 'textarea',
        placeholder: '',
      },
      {
        name: 'wordsToAvoid',
        label: 'Words, phrases, or claims to avoid',
        help: 'Anything that does not sound like you, or that legal would flag.',
        type: 'textarea',
        placeholder: '',
      },
      {
        name: 'sendingEmail',
        label: 'Which email should pitches be sent from?',
        help: 'Hosts reply here. Ideally a real, monitored inbox on your domain.',
        type: 'email',
        placeholder: 'jane@company.com',
      },
      {
        name: 'sendingDomainStatus',
        label: 'Is that sending address new or established?',
        help: 'A brand-new domain needs a gentle warm-up before volume.',
        type: 'select',
        options: [
          'Established (used for 3+ months)',
          'Fairly new (under 3 months)',
          'Brand new / not set up yet',
          'Not sure',
        ],
      },
      {
        name: 'replyHandling',
        label: 'Who responds when a host replies?',
        type: 'select',
        options: [
          'I reply myself (you forward me the positives)',
          'Help me draft replies',
          'Not sure yet',
        ],
      },
      {
        name: 'bookingLink',
        label: 'Your scheduling / booking link',
        help: 'Calendly, SavvyCal, etc. Speeds up confirmed bookings.',
        type: 'url',
        placeholder: 'https://calendly.com/...',
      },
      {
        name: 'recordingReadiness',
        label: 'Recording setup & availability',
        help: 'Decent mic and camera? Quiet space? Days/times that generally work?',
        type: 'textarea',
        placeholder: 'Logitech cam + Shure mic; weekday mornings US Central work best.',
      },
    ],
  },
  {
    id: 'anything-else',
    title: 'Timing & anything else',
    blurb: 'Deadlines and context that change how we prioritize.',
    fields: [
      {
        name: 'timing',
        label: 'Any upcoming launches, deadlines, or seasonal hooks?',
        help: 'Book launch, funding announcement, event, product release, a date we should aim for.',
        type: 'textarea',
        placeholder: '',
      },
      {
        name: 'anythingElse',
        label: 'Anything else we should know?',
        type: 'textarea',
        placeholder: '',
      },
    ],
  },
];

/** Flat list of every field name, for validation on the server. */
export const allFieldNames: string[] = intakeSections.flatMap((s) =>
  s.fields.map((f) => f.name)
);
