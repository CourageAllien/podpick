import type { Metadata } from 'next';

/**
 * Prospect strategy page — Tarun Singh, founder & CEO of Innovatech Solutions
 * (brand: GrowthX).
 *
 * Same two-part layout as the other samples: a host-facing media kit, then
 * internal booking strategy (two recommended shows + two customized pitches).
 *
 * Pitches follow the newer outreach guide:
 *   - Subject line: "[host first] <> Tarun intro"
 *   - Greeting and a very specific episode detail on the SAME line (no line
 *     break after the greeting), so the email reads well on a phone.
 *   - A relevancy paragraph that connects Tarun's expertise to that episode,
 *     rather than praising how great he is.
 *   - CTA: "Would you be interested in learning more about Tarun?"
 *   - Signature: "Mark".
 *   - A PS with a human, personal touch, kept bracketed for the booker to
 *     personalize from the host's LinkedIn or Instagram before sending.
 *
 * Facts are drawn from public sources (innovatcs.com / growthx, Tarun's
 * LinkedIn, and press coverage). His public profiles use "he." Per house style
 * there are no em dashes, and external copy never uses the two-letter term for
 * machine intelligence. Pitch hooks reference real, verifiable shows and
 * episodes; the exact episode detail and the PS stay editable for the booker.
 */

export const metadata: Metadata = {
  title: 'Tarun Singh | Podcast guest strategy',
  description:
    'Founder and CEO of GrowthX (Innovatech Solutions) and "The Law Firm Guru." He scales law firms and aesthetic practices with data-driven growth systems.',
};

const angles = [
  {
    title: 'Visibility into revenue',
    description:
      'Why marketing for a professional practice should be judged on signed cases and booked consultations, not clicks and impressions, and how to build a system that proves it.',
  },
  {
    title: 'The law firm growth playbook',
    description:
      'What actually separates firms that scale from firms that stall, from a lawyer-turned-marketer who has helped generate more than $100M for legal practices.',
  },
  {
    title: 'One engine, two verticals',
    description:
      'Why law firms and medspas have more in common than they think, high-intent local clients and trust-driven buying, and how the same growth engine serves both.',
  },
];

const questions = [
  'You go by "The Law Firm Guru" and you hold a JD. How does thinking like a lawyer change the way you market one?',
  'You have helped generate over $100M for law and medical practices. What is the one growth lever owners consistently underuse?',
  'You run the same growth engine for law firms and aesthetic practices. What do those two worlds actually have in common?',
  'Most practice owners cannot tell which marketing dollar produced a real client. How do you fix that?',
  'You host your own invite-only podcast. What did being on the other side of the mic teach you about building authority?',
];

const shows = [
  {
    name: 'The Game Changing Attorney Podcast',
    host: 'Michael Mogill',
    url: 'https://www.crisp.co/podcast/',
    audience:
      'Ambitious law firm owners and legal market leaders (billed as the #1 podcast for the category) focused on scaling their firms through marketing, leadership, and hiring.',
    why: 'Tarun is "The Law Firm Guru" with a JD and $100M+ generated for legal practices. He speaks the audience’s language and brings a systems view of turning visibility into signed cases, plus the credibility of running his own show.',
    anchor:
      'Episode anchor: "The Real Reason Clients Choose One Lawyer Over Another," on earning trust and visibility before the case walks in. Tarun brings the engine behind it.',
  },
  {
    name: 'Medical Millionaire',
    host: 'Cameron Hemphill',
    url: 'https://themedicalmillionairepodcast.com/',
    audience:
      'Owners and entrepreneurs in medspas, plastic surgery, dermatology, and elective wellness (50k+ downloads) who want to market smarter and scale their practices.',
    why: 'Tarun runs the same data-driven growth engine for aesthetic practices that he runs for law firms. He can give concrete tactics on attracting high-value patients and tying spend to booked consultations, not clicks.',
    anchor:
      'Episode anchor: "Market Your MedSpa To Your Market," on speaking to the high-intent local patient instead of casting too wide. Tarun brings the execution playbook.',
  },
];

const pitches = [
  {
    show: 'The Game Changing Attorney Podcast',
    subject: 'Michael <> Tarun intro',
    body: `Hi Michael - your episode "The Real Reason Clients Choose One Lawyer Over Another," where you make the case that the firm that wins is the one that earns trust and visibility long before the case walks in, lands exactly where I spend my days.

That is the whole premise of Tarun Singh's work. He is the founder and CEO of GrowthX (Innovatech Solutions), goes by "The Law Firm Guru," and holds a JD himself, so he thinks like a lawyer about how a firm earns and converts attention. He has helped generate more than $100M for law and medical practices by building data-driven systems that tie every marketing dollar back to signed cases rather than vanity metrics. He also hosts his own podcast, so he knows how to be a great guest, not just a good one. Your firm owners would get a concrete look at turning visibility into real revenue.

Would you be interested in learning more about Tarun?

Mark

PS: [reference a recent Crisp moment or a post from Michael's LinkedIn to keep the open human]`,
  },
  {
    show: 'Medical Millionaire',
    subject: 'Cameron <> Tarun intro',
    body: `Hi Cameron - your episode "Market Your MedSpa To Your Market," on the trap of casting too wide a net instead of speaking to the high-intent local patient, is one I have passed along more than once.

That focus is exactly how Tarun Singh builds growth for aesthetic practices. He is the founder and CEO of GrowthX (Innovatech Solutions) and runs the same data-driven engine for medspas that he runs for law firms: local SEO, paid, and marketing automation tuned to booked consultations rather than clicks. He has helped generate over $100M across medicine and law, so he can get specific on attracting high-value patients without burning budget. Your owners would get an operator's playbook for turning a marketing spend into a predictable patient pipeline.

Would you be interested in learning more about Tarun?

Mark

PS: [pull a recent detail from Cameron's LinkedIn or a Growth99 post to personalize the open]`,
  },
];

export default function GrowthXSamplePage() {
  const name = 'Tarun Singh';

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
              Founder and CEO of GrowthX (Innovatech Solutions) and "The Law Firm Guru." He scales law
              firms and aesthetic practices with data-driven growth systems.
            </p>
            <p className="mt-1 font-mono text-sm uppercase tracking-wide text-terracotta">
              GrowthX · Growth marketing for law &amp; medicine · Vienna, VA · JD · Host, Success in
              Excess
            </p>
          </div>
        </header>

        <section className="mt-12">
          <h2 className="font-serif text-2xl">About</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-stone-700">
            {`Tarun Singh is the founder and CEO of Innovatech Solutions, the company behind GrowthX, a hybrid growth engine that combines marketing execution with business automation for professional practices. Known as "The Law Firm Guru," he holds a JD and has spent his career at the intersection of law, medicine, and growth, helping generate more than $100M for clients across legal, healthcare, and aesthetic verticals.

Based in Vienna, Virginia, GrowthX serves law firms, medspas, plastic surgeons, and other high-trust local businesses with one connected system: SEO and local SEO, paid advertising across Google, Meta, and YouTube, web design, and marketing automation built around booked cases and consultations rather than vanity metrics. Tarun also hosts Success in Excess, an invite-only podcast spotlighting the operators behind today's most innovative law firms and medspas, and his work has been featured across outlets including Forbes, Bloomberg, NBC, CNN, and USA Today. His through-line is consistent: turn visibility into authority, and authority into measurable revenue.`}
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
          <h2 className="mt-2 font-serif text-3xl">Two shows to book Tarun on</h2>

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
                  <span className="font-medium">Why Tarun fits: </span>
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
            on one line, a relevancy connection to Tarun’s expertise, a one-word-reply call to action,
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
          Powered by PodEngine
        </footer>
      </div>
    </main>
  );
}
