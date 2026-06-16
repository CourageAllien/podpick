import type { Metadata } from 'next';

/**
 * Prospect strategy page — Ravid Razak, founder & CEO of DreamItReel.
 *
 * Same two-part layout as the other samples: a host-facing media kit, then
 * internal booking strategy (two recommended shows + two customized pitches).
 *
 * Pitches follow the NEWER outreach guide for this prospect, which differs from
 * the other sample pages:
 *   - Subject line: "[host first] <> Ravid intro"
 *   - Greeting and a very specific episode detail on the SAME line (no line
 *     break after the greeting), so the email reads well on a phone.
 *   - A relevancy paragraph that connects Ravid's expertise to that episode,
 *     rather than praising how great he is.
 *   - CTA: "Would you be interested in learning more about Ravid?"
 *   - Signature: "Mark" (not Alex).
 *   - A PS with a human, personal touch, kept bracketed for the booker to
 *     personalize from the host's LinkedIn or Instagram before sending.
 *
 * Facts are drawn from public sources (dreamitreel.com, Ravid's LinkedIn, and
 * founder interviews). His public profiles use "he." Per house style there are
 * no em dashes, and external copy never uses the two-letter term for machine
 * intelligence. Pitch hooks reference real, verifiable shows; the exact episode
 * detail and the PS stay editable for the booker to confirm on a listen.
 */

export const metadata: Metadata = {
  title: 'Ravid Razak | Podcast guest strategy',
  description:
    'Founder and CEO of DreamItReel, an on-demand video production marketplace built to help brands create video at the speed of social.',
};

const angles = [
  {
    title: 'The $1,000 edit that started a company',
    description:
      'How a frustrating quote to edit a few minutes of travel footage turned into a video production marketplace, and what that says about finding a real problem before you build.',
  },
  {
    title: 'Video at the speed of social',
    description:
      'Why brands can no longer make video fast enough, where the production bottleneck actually sits, and how to keep up with the pace social platforms now demand.',
  },
  {
    title: 'Productizing creative work',
    description:
      'What has to be true to turn something as bespoke as video production, live-action, animation, and motion graphics, into a predictable on-demand service.',
  },
];

const questions = [
  'You got quoted over $1,000 to edit a few minutes of your own travel footage. How did that turn into DreamItReel?',
  'You left management consulting to start a video company. What did consulting teach you that still shapes how you run the business?',
  'Brands say they cannot produce video fast enough. Where does the bottleneck really sit?',
  'You productized something as custom as video production. What has to be true to make creative work on-demand?',
  'Where do most brands waste money on video, and what would you tell them to do instead?',
];

const shows = [
  {
    name: 'The Foundr Podcast',
    host: 'Nathan Chan',
    url: 'https://foundr.com/',
    audience:
      'Aspiring and early-stage founders who want the unfiltered playbooks behind how real companies got built, from bootstrapped brands to venture-backed startups.',
    why: 'Ravid is a self-funded founder who turned one personal frustration into a marketplace. He can speak straight to the show’s bootstrapping-versus-funding thread, and to productizing a creative service most people assume cannot be productized.',
    anchor:
      'Episode anchor: the show’s recurring bootstrapped-founder interviews and the "funding vs bootstrapping, the real tradeoffs" theme. Ravid brings the DreamItReel origin story.',
  },
  {
    name: 'The Marketing Millennials',
    host: 'Daniel Murray',
    url: 'https://themarketingmillennials.com/',
    audience:
      'Marketers and content leaders (a large, fast-growing audience) who want tactical playbooks they can take straight into their weekly marketing meeting.',
    why: 'Ravid’s whole thesis, create video at the speed of social, is the wall this audience hits every week. He gives them an operator’s view on producing more video, faster, without standing up a full production team.',
    anchor:
      'Episode anchor: the show’s running case that brands now have to produce content at creator speed, not agency speed. Ravid brings the production-side answer.',
  },
];

const pitches = [
  {
    show: 'The Foundr Podcast',
    subject: 'Nathan <> Ravid intro',
    body: `Hi Nathan - your running thread on bootstrapping versus funding, and the idea that bootstrapping forces you to fall in love with a real, painful problem before you spend a dollar, is one I keep coming back to.

That is more or less the DreamItReel origin story. Ravid Razak left a management consulting career, got quoted over $1,000 to edit a few minutes of his own travel footage, and decided to build the thing he wished existed: an on-demand video production marketplace that lets brands create video at the speed of social. He bootstrapped it from that one frustration into a platform serving brands, agencies, and creators, and he can talk candidly about productizing a creative service most founders assume cannot be productized.

Would you be interested in learning more about Ravid?

Mark

PS: [pull a specific, recent detail from Nathan's LinkedIn or a Foundr milestone to keep the open human]`,
  },
  {
    show: 'The Marketing Millennials',
    subject: 'Daniel <> Ravid intro',
    body: `Hi Daniel - your running point that brands now have to produce content at creator speed, not agency speed, is exactly the wall I watch marketing teams hit every single week.

That gap is the entire reason Ravid Razak built DreamItReel, where he is founder and CEO. The tagline is literally "create video at the speed of social," and the platform pulls together live-action, animation, motion graphics, and editing so a team can turn a brief into finished video without standing up a full production. Before this he was a consultant who got quoted over $1,000 to edit a few minutes of travel footage and figured there had to be a better model. Your audience would get a practical, budget-aware playbook for making more video, faster.

Would you be interested in learning more about Ravid?

Mark

PS: [reference a recent Marketing Millennials short or one of Daniel's LinkedIn posts to personalize the open]`,
  },
];

export default function DreamItReelSamplePage() {
  const name = 'Ravid Razak';

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
              Founder and CEO of DreamItReel, an on-demand video production marketplace built to help
              brands create video at the speed of social.
            </p>
            <p className="mt-1 font-mono text-sm uppercase tracking-wide text-terracotta">
              DreamItReel · On-demand video production marketplace · New York, NY · ex-management
              consultant
            </p>
          </div>
        </header>

        <section className="mt-12">
          <h2 className="font-serif text-2xl">About</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-stone-700">
            {`Ravid Razak is the founder and CEO of DreamItReel, an on-demand video production marketplace he started in 2015. The idea came from a personal frustration: after traveling and shooting hours of footage on his phone and a GoPro, he was quoted more than $1,000 to edit a few simple minutes of it. He figured there had to be a faster, more affordable way, and he built it.

Before DreamItReel, Ravid worked as a management consultant, advising large organizations before leaving to go all in on the company. Today DreamItReel pairs an on-demand marketplace with subscription production, combining live-action, animation, motion graphics, stock, and editing so brands, agencies, and creators can turn a brief into finished video without standing up a full in-house team. The through-line of his work is simple: video should move as fast as the platforms it lives on, and creative production can be made predictable, affordable, and genuinely on-demand.`}
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
          <h2 className="mt-2 font-serif text-3xl">Two shows to book Ravid on</h2>

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
                  <span className="font-medium">Why Ravid fits: </span>
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
            Written to the outreach guide: a 5-second read, the greeting and a specific episode detail
            on one line, a relevancy connection to Ravid’s expertise, a one-word-reply call to action,
            signed Mark, and a personal PS. Confirm the exact episode detail and personalize the PS
            from the host’s LinkedIn or Instagram before sending.
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
