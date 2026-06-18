import type { Metadata } from 'next';

/**
 * Prospect strategy page — Lyndsi Stafford, founder & CEO of eLuminate Marketing.
 *
 * Same two-part layout as the other samples: a host-facing media kit, then
 * internal booking strategy (two recommended shows + two customized pitches
 * written to the house outreach framework).
 *
 * Facts are drawn from public sources (eluminatemarketing.com, BusinessCollective,
 * and her Authority Magazine interviews, where she is published as Lyndsi Edgar).
 * Her site uses "she." Per house style there are no em dashes, and external copy
 * never uses the two-letter term for machine intelligence. Pitch hooks reference
 * real, verifiable shows; PS lines stay bracketed for the booker to personalize.
 */

export const metadata: Metadata = {
  title: 'Lyndsi Stafford | Podcast guest strategy',
  description:
    'Founder and CEO of eLuminate Marketing. Building trusted, story-driven brands for professional-services firms, from startups to billion-dollar companies.',
};

const angles = [
  {
    title: 'Marketing that tells a story',
    description:
      'Why great marketing is a story that compels people to buy, the real difference between brand and product marketing, and why the small firm that gets this wins on more than price.',
  },
  {
    title: 'Niche your way to growth',
    description:
      'How a twenty-something founder built a focused agency for law firms, real estate, and financial services, and why going deep in a niche beats trying to serve everyone.',
  },
  {
    title: 'A trusted and beloved brand',
    description:
      'The handful of things a brand actually needs to earn loyalty: authenticity, real feedback, and treating customers and employees like family, so people reach for you every time.',
  },
];

const questions = [
  'You founded eLuminate in your twenties. What did you get right early, and what did you have to unlearn?',
  'You serve law firms, CRE brokers, and financial advisors. What do professional-services firms consistently get wrong about marketing?',
  'You draw a sharp line between brand marketing and product marketing. Why does that distinction matter so much for a smaller firm?',
  'You say to treat customers and employees like family. How does that actually show up in the work?',
  'Your family motto is "Not to Worry." How do you hold onto that while running an agency?',
];

const shows = [
  {
    name: 'Build a Better Agency',
    host: 'Drew McLellan',
    url: 'https://buildabetteragency.libsyn.com/',
    audience:
      'Agency owners and leaders building more profitable, sustainable, founder-led shops, with a strong belief in the power of niche specialization.',
    why: 'Lyndsi is a living example of what this show preaches: she built eLuminate from a twenty-something founder into a focused agency for professional-services niches. She can give concrete stories on niching into law, real estate, and financial services.',
    anchor:
      'Episode anchor: the show’s recurring case that niche, founder-led boutiques win by going deep, not broad, while the giants stumble.',
  },
  {
    name: 'On Brand with Nick Westergaard',
    host: 'Nick Westergaard',
    url: 'https://onbrandpodcast.com/',
    audience:
      'Marketers and communicators who want to tell stronger stories and build better brands. Past guests include Seth Godin and Nancy Duarte.',
    why: 'Lyndsi’s entire philosophy, that great marketing tells a story that compels people to buy, is this show’s thesis. She brings the agency-operator view: how a smaller firm actually builds a trusted, story-driven brand on a real budget.',
    anchor:
      'Episode anchor: the show’s core promise of telling stronger stories to build better brands, and its recurring brand-versus-product thread.',
  },
];

const pitches = [
  {
    show: 'Build a Better Agency',
    subject: 'Drew <> Lyndsi intro',
    body: `Hi Drew - your running case that niche, founder-led boutiques are the agencies built to thrive while the giants stumble is something I keep coming back to.

That is basically Lyndsi Stafford's story. She founded eLuminate Marketing in her twenties and grew it into a focused shop for professional-services firms: law firms, commercial real estate brokers, and financial advisors, with clients ranging from a few million to billions in revenue. She has an MS in Integrated Marketing Communication and 15 years in the work, and she leads with a rule your audience would nod at: treat your clients and your team like family, because retention beats price. She would give your agency-owner listeners a concrete look at building by going deep in a niche.

Would you be interested in learning more about Lyndsi as a potential guest?

Alex

PS: [pull a specific detail from a recent Build a Better Agency episode or one of Drew's AMI workshops]`,
  },
  {
    show: 'On Brand with Nick Westergaard',
    subject: 'Nick <> Lyndsi intro',
    body: `Hi Nick - I love that the whole premise of On Brand is telling stronger stories to build better brands, and the way you keep pulling the brand-versus-product distinction out of your guests.

That distinction is the heart of how Lyndsi Stafford works. She is the founder and CEO of eLuminate Marketing, and her north star is simple: great marketing tells a story that compels people to buy what you are selling. She has spent 15 years building trusted, story-driven brands for professional-services firms, and she has a refreshingly grounded five-part take on what a beloved brand actually requires, starting with authenticity and treating people like family. She would give your audience the small-agency operator view to balance the big-brand guests.

Would you be interested in learning more about Lyndsi as a potential guest?

Alex

PS: [reference a recent On Brand guest like Seth Godin or Nancy Duarte, or one of Nick's own books]`,
  },
];

export default function EluminateMarketingSamplePage() {
  const name = 'Lyndsi Stafford';

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
              Founder and CEO of eLuminate Marketing. Building trusted, story-driven brands for
              professional-services firms, from startups to billion-dollar companies.
            </p>
            <p className="mt-1 font-mono text-sm uppercase tracking-wide text-terracotta">
              eLuminate Marketing · Branding &amp; digital marketing · Fort Lauderdale, FL · MS,
              Integrated Marketing Communication
            </p>
          </div>
        </header>

        <section className="mt-12">
          <h2 className="font-serif text-2xl">About</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-stone-700">
            {`Lyndsi Stafford is the founder and CEO of eLuminate Marketing, a branding and digital-marketing agency she started in 2014 while still in her twenties. She holds a Master of Science in Integrated Marketing Communication and has spent more than 15 years building online marketing strategies. Her firm works with professional-services clients across law, commercial real estate, financial services, healthcare, education, hospitality, and nonprofits, from a few million to billions of dollars in annual revenue.

Her philosophy is simple enough to fit on a business card: great marketing tells a story that compels people to buy what you are selling. She draws a sharp line between brand marketing, what comes to mind when someone hears your name, and product marketing, the price and the features, and she argues a trusted, beloved brand is built on authenticity, real feedback, and treating both customers and employees like family. Published in Authority Magazine as Lyndsi Edgar, she still leads by her family's motto, "Not to Worry," a reminder that health, family, and purpose outlast any quarter's metrics.`}
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
          <h2 className="mt-2 font-serif text-3xl">Two shows to book Lyndsi on</h2>

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
                  <span className="font-medium">Why Lyndsi fits: </span>
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
          Powered by PodEngine
        </footer>
      </div>
    </main>
  );
}
