import type { Metadata } from 'next';

/**
 * Prospect strategy page — Michael Brian Lee, founder of the Innotivity Institute.
 *
 * Same two-part layout as the other samples: a host-facing media kit, then
 * internal booking strategy (two recommended shows + two customized pitches
 * written to the house outreach framework).
 *
 * Facts are drawn from public sources (michaelbrianlee.com, the Goldstein Patent
 * Law interview, and RocketReach/LinkedIn). The bio uses "he," matching his own
 * site. Per house style there are no em dashes, and external copy never uses the
 * two-letter term for machine intelligence. Pitch hooks reference real,
 * verifiable episodes; PS lines stay bracketed for the booker to personalize.
 */

export const metadata: Metadata = {
  title: 'Michael Brian Lee | Podcast guest strategy',
  description:
    'Founder of the Innotivity Institute. Helping leaders and entrepreneurs innovate themselves first, so creativity and adaptability become a daily skill, not a rare gift.',
};

const angles = [
  {
    title: 'Think into the box, not outside it',
    description:
      'Why the "think outside the box" advice backfires, and how understanding the mental frameworks you already live in, then expanding and remixing them, is how real innovation actually happens.',
  },
  {
    title: 'Innovate yourself first',
    description:
      'The most important innovation a founder will ever make is the one in their own mindset. Why the real block to creativity is identity, not skill, and how to get past "I am not creative."',
  },
  {
    title: 'Adaptability as a survival skill',
    description:
      'How innovation went from a rare trait to a mandatory business skill, why coaching for it should be as normal as executive coaching, and how to lead a team that can dance with uncertainty.',
  },
];

const questions = [
  'You say "think into the box," not outside it. What does almost everyone get wrong about creativity?',
  'Research shows 98% of five-year-olds test as creative geniuses and only 2% of adults do. What happens to us?',
  'You argue the biggest block to creativity is identity, not skill. How does someone get past "I am not creative"?',
  'You spent 25 years in film and television before this. What did producing teach you about innovation that the business books miss?',
  'For a founder trying to build an innovative culture, what is the first thing they have to change about themselves?',
];

const shows = [
  {
    name: 'The Innovation Show',
    host: 'Aidan McCullen',
    url: 'https://theinnovationshow.io/',
    audience:
      'Leaders, founders, and change-makers who want to build cultures of adaptability, reinvention, and change readiness. The only podcast to win a Thinkers50 Award.',
    why: 'Michael’s "innovate yourself" modality is the personal-transformation layer beneath the organizational reinvention this show is built on. He adds a 25-year creative-industry lens and a "think into the box" reframe the host’s audience would seize on.',
    anchor:
      'Episode anchor: the host’s own "Undisruptable: A Mindset of Permanent Reinvention" (seeing change as an opportunity to seize, not an obstacle to survive).',
  },
  {
    name: 'Unlearn',
    host: "Barry O'Reilly",
    url: 'https://barryoreilly.com/',
    audience:
      'High performers, founders, and senior leaders working to let go of the mindsets and habits that were once effective but now quietly hold them back.',
    why: 'O’Reilly’s whole thesis (the thing limiting you is the inability to unlearn what used to work) is the same wall Michael coaches people through under "innovate yourself" and the identity barrier. Michael brings the creativity framework and the data that explains why we lose it.',
    anchor:
      'Episode anchor: the show’s core "Think Big, Start Small, Learn Fast" unlearning cycle, on letting go of past success to reach the next level.',
  },
];

const pitches = [
  {
    show: 'The Innovation Show',
    subject: 'Aidan <> Michael intro',
    body: `Hi Aidan - I went back through your "Undisruptable" episode on permanent reinvention, and the framing of change as an opportunity to seize rather than an obstacle to survive really stuck with me.

That is the exact mindset Michael Brian Lee coaches, one layer deeper. He is the founder of the Innotivity Institute and the only certified Master of Creativity and Innovation Coaching in the world, and his whole modality runs on a single idea: the most important innovation you will ever make is to innovate yourself. He flips "think outside the box" into "think into the box," understanding the mental frameworks you already live in, then expanding and remixing them, the way BIC took "cheap, plastic, disposable" from pens to lighters to razors. He brings 25 years in film and television to all of it, so your reinvention-minded audience would love how concrete he makes the inner work.

Would you be interested in learning more about Michael as a potential guest?

Alex

PS: [pull a specific detail from a recent Innovation Show guest or one of Aidan's Thinkers50 talks]`,
  },
  {
    show: 'Unlearn',
    subject: 'Barry <> Michael intro',
    body: `Hi Barry - your core idea on Unlearn, that the thing holding high performers back is not the inability to learn but the inability to unlearn what used to work, is something I have been quoting to people all week.

That is the same wall Michael Brian Lee helps people break through, from the creativity side. He is the founder of the Innotivity Institute and the world's only certified Master of Creativity and Innovation Coaching, and he argues the real block to creativity is not skill, it is identity: people decide "I am not creative" and then live inside that box. He pairs that with the George Land research showing 98% of five-year-olds test as creative geniuses while only 2% of adults do. For your audience of leaders working to let go of past success, he gives them a framework for what to build in its place.

Would you be interested in learning more about Michael as a potential guest?

Alex

PS: [reference a recent Unlearn guest or one of Barry's Think Big, Start Small, Learn Fast stories]`,
  },
];

export default function InnotivityInstituteSamplePage() {
  const name = 'Michael Brian Lee';

  return (
    <main className="min-h-screen bg-cream text-stone-900">
      <div
        aria-hidden
        className="h-2 w-full"
        style={{
          backgroundImage: 'radial-gradient(circle, #C76F4E 1px, transparent 1px)',
          backgroundSize: '10px 10px',
        }}
      />

      <div className="mx-auto max-w-3xl px-6 py-14">
        {/* ── MEDIA KIT ───────────────────────────────────────── */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-serif text-4xl">{name}</h1>
            <p className="mt-2 text-lg text-stone-600">
              Founder of the Innotivity Institute. Helping leaders and entrepreneurs innovate
              themselves first, so creativity and adaptability become a daily skill, not a rare gift.
            </p>
            <p className="mt-1 font-mono text-sm uppercase tracking-wide text-terracotta">
              Innotivity Institute · Creativity, innovation &amp; adaptability coaching · South Africa
              &amp; United States · ICF ACC · NLP · AQ
            </p>
          </div>
        </header>

        <section className="mt-12">
          <h2 className="font-serif text-2xl">About</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-stone-700">
            {`Michael Brian Lee is the founder of the Innotivity Institute and the creator of the Innotivity modality, built on one deceptively simple idea: the most important innovation you will ever make is to innovate yourself. He is the only certified Master of Creativity and Innovation Coaching in the world, an ICF-credentialed coach, an NLP Master Practitioner, and a certified Adaptability Quotient professional, and he holds an MA in Political Science from Stanford, with a master's in Creativity and Change Leadership underway at Buffalo State.

Before he trained leaders on creativity, innovation, and adaptability, Michael spent more than 25 years in film and television as a writer, producer, director, and script editor across Africa, Europe, and the United States, work that earned five South African Film and TV Awards, and he founded the Academy of Television and Screen Arts in Johannesburg. A dual citizen of South Africa and the United States, he is best known for flipping "think outside the box" on its head: his "think into the box" approach has people understand the mental frameworks they already live in, then expand, change, and combine them, the way BIC turned one idea into pens, lighters, and razors.`}
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-serif text-2xl">Topics</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {angles.map((a) => (
              <div key={a.title} className="rounded-lg border border-stone-200 bg-white/60 p-4">
                <h3 className="font-medium">{a.title}</h3>
                <p className="mt-2 text-sm text-stone-600">{a.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="font-serif text-2xl">Questions to ask</h2>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-stone-700">
            {questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </section>

        {/* ── BOOKING STRATEGY (internal) ─────────────────────── */}
        <div className="mt-16 border-t-2 border-dashed border-stone-300 pt-10">
          <p className="font-mono text-xs uppercase tracking-widest text-stone-400">
            Internal · booking strategy
          </p>
          <h2 className="mt-2 font-serif text-3xl">Two shows to book Michael on</h2>

          <div className="mt-6 space-y-6">
            {shows.map((s) => (
              <div key={s.name} className="rounded-xl border border-stone-200 bg-white/70 p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-serif text-xl">{s.name}</h3>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-xs text-terracotta underline"
                  >
                    {s.url.replace('https://', '')}
                  </a>
                </div>
                <p className="mt-1 text-sm text-stone-500">Host: {s.host}</p>
                <p className="mt-3 text-sm text-stone-700">
                  <span className="font-medium">Who listens: </span>
                  {s.audience}
                </p>
                <p className="mt-2 text-sm text-stone-700">
                  <span className="font-medium">Why Michael fits: </span>
                  {s.why}
                </p>
                <p className="mt-3 font-mono text-xs text-stone-500">{s.anchor}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── PITCHES ─────────────────────────────────────────── */}
        <div className="mt-14">
          <h2 className="font-serif text-3xl">The pitches</h2>
          <p className="mt-2 text-sm text-stone-600">
            Written to the outreach framework: a 5-second read, a specific episode hook that proves
            we listened, the relevance connection, and a one-word-reply call to action. Signature and
            PS are editable; confirm the exact episode detail on a listen before sending.
          </p>

          <div className="mt-6 space-y-6">
            {pitches.map((p) => (
              <div key={p.show} className="overflow-hidden rounded-xl border border-stone-300 bg-white">
                <div className="border-b border-stone-200 bg-stone-50 px-5 py-3">
                  <p className="font-mono text-xs uppercase tracking-wide text-stone-400">
                    Pitch · {p.show}
                  </p>
                  <p className="mt-1 text-sm">
                    <span className="text-stone-400">Subject: </span>
                    <span className="font-medium">{p.subject}</span>
                  </p>
                </div>
                <pre className="whitespace-pre-wrap px-5 py-4 font-sans text-sm leading-relaxed text-stone-800">
                  {p.body}
                </pre>
              </div>
            ))}
          </div>
        </div>

        <footer className="mt-16 border-t border-stone-200 pt-6 text-center font-mono text-xs text-stone-400">
          Powered by Podpick
        </footer>
      </div>
    </main>
  );
}
