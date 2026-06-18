import type { Metadata } from 'next';

/**
 * Prospect strategy page — Mike Jones, CEO of Resound (B2B branding agency).
 *
 * Same two-part layout as the other samples: a host-facing media kit, then
 * internal booking strategy (two recommended shows + two customized pitches
 * written to the house outreach framework).
 *
 * Facts are drawn from public sources (resoundcreative.com, BusinessCollective,
 * and VoyagePhoenix). His bio uses "he." Per house style there are no em dashes,
 * and external copy never uses the two-letter term for machine intelligence.
 * Pitch hooks reference real, verifiable shows; PS lines stay bracketed for the
 * booker to personalize.
 */

export const metadata: Metadata = {
  title: 'Mike Jones | Podcast guest strategy',
  description:
    'CEO of Resound, an award-winning B2B branding agency, and co-author of You Are Remarkable. He builds B2B brands on authenticity and purpose, not volume.',
};

const angles = [
  {
    title: 'Remarkable, not just visible',
    description:
      'Why authenticity and a die-hard commitment to values and purpose, not a louder logo, is what builds a B2B brand people stay loyal to.',
  },
  {
    title: 'Branding for the "boring" B2B',
    description:
      'How professional-services and B2B companies, the ones who assume branding is for consumer brands, actually build a brand that wins business.',
  },
  {
    title: 'Conscious capitalism in practice',
    description:
      'Running a values-led agency and serving purpose-driven brands without letting purpose collapse into a slogan, and whether it really moves the numbers.',
  },
];

const questions = [
  'You wrote a book called "You Are Remarkable." What does remarkable actually mean for a B2B company that thinks it is boring?',
  'Most B2B leaders treat branding as a logo and a color palette. Where does that thinking cost them the most?',
  'You have built brands from Google to a dairy farm. What is true about brand at every size?',
  'You sit on the board of Conscious Capitalism Arizona. Does purpose actually move the numbers, or is that wishful thinking?',
  'You host two podcasts about branding. What is the myth you keep having to debunk?',
];

const shows = [
  {
    name: 'The Marketing Book Podcast',
    host: 'Douglas Burdett',
    url: 'https://www.marketingbookpodcast.com/',
    audience:
      'Marketers and founders who want the ideas from the newest marketing and sales books, distilled by the authors. Named a top marketing podcast by LinkedIn and Forbes.',
    why: 'The show interviews one marketing author per episode, and Mike co-wrote "You Are Remarkable: Unlock Your Authentic Brand to Win Loyal Customers." He is exactly the guest this format is built for, with two decades of brand work behind the ideas.',
    anchor:
      'Episode anchor: the show’s format itself, a full episode unpacking one author’s book. Mike brings "You Are Remarkable" and the authenticity-and-purpose argument behind it.',
  },
  {
    name: 'Renegade Marketers Unite',
    host: 'Drew Neisser',
    url: 'https://renegademarketing.com/',
    audience:
      'B2B CMOs and aspiring marketing executives (250k+ downloads, the #2 podcast for CMOs), covering brand building, strategy, and demand generation.',
    why: 'Drew literally wrote "Renegade Marketing: 12 Steps to Building Unbeatable B2B Brands." Mike’s authentic, values-led B2B branding sits right in that lane, and he adds the boutique-agency and conscious-capitalism angle the CMO audience rarely hears.',
    anchor:
      'Episode anchor: the host’s "unbeatable B2B brands" thesis and the show’s recurring CMO brand-building episodes. Mike brings the purpose-as-strategy case.',
  },
];

const pitches = [
  {
    show: 'The Marketing Book Podcast',
    subject: 'Douglas <> Mike intro',
    body: `Hi Douglas - I have been working through your back catalog of author interviews, and the way you get a writer to distill an entire book down to the few ideas that actually matter is a real skill.

I think you would enjoy Mike Jones. He is the CEO of Resound, an award-winning B2B branding agency, and the co-author of "You Are Remarkable: Unlock Your Authentic Brand to Win Loyal Customers." He has spent 20 years building brands for everyone from Google and HP to a dairy farm, and his book makes a sharp argument: B2B companies that think they are boring are usually just hiding their authenticity. He also hosts two branding podcasts of his own, so he knows how to be a great guest, not just a good one.

Would you be interested in learning more about Mike as a potential guest?

Alex

PS: [pull a specific detail from a recent Marketing Book Podcast episode or one of Douglas's author picks]`,
  },
  {
    show: 'Renegade Marketers Unite',
    subject: 'Drew <> Mike intro',
    body: `Hi Drew - your core idea in "Renegade Marketing," that the best B2B brands are built on a clear, courageous through-line rather than more tactics, is one I keep coming back to.

It is also the hill Mike Jones builds on. He is the CEO of Resound, an award-winning B2B branding agency, and the co-author of "You Are Remarkable." He argues that authenticity and a die-hard commitment to values and purpose are what make a B2B brand unbeatable, and he has two decades of work, from Google to Shamrock Farms, plus a seat on the board of Conscious Capitalism Arizona, to back it up. Your CMO audience would get a concrete take on making purpose a strategy, not a slogan.

Would you be interested in learning more about Mike as a potential guest?

Alex

PS: [reference a recent Renegade Marketers Unite CMO guest or a line from Drew's book]`,
  },
];

export default function ResoundCreativeSamplePage() {
  const name = 'Mike Jones';

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
              CEO of Resound, an award-winning B2B branding agency, and co-author of You Are
              Remarkable. He builds B2B brands on authenticity and purpose, not volume.
            </p>
            <p className="mt-1 font-mono text-sm uppercase tracking-wide text-terracotta">
              Resound · B2B branding agency · Tempe, AZ · Author, You Are Remarkable · Conscious
              Capitalism
            </p>
          </div>
        </header>

        <section className="mt-12">
          <h2 className="font-serif text-2xl">About</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-stone-700">
            {`Mike Jones is the CEO and Managing Partner of Resound, an award-winning B2B branding agency based in Tempe, Arizona. Over the last 20 years he has built, or led teams that built, brand experiences for hundreds of companies, from Google, HP, and Starwood Hotels and Resorts to Shamrock Farms and Breezes Resorts. He is the co-author of "You Are Remarkable: Unlock Your Authentic Brand to Win Loyal Customers," and he hosts two branding podcasts, the Remarkabrand Podcast and Resoundcast.

His thesis is simple and a little contrarian for B2B: remarkable brands are not the loudest ones, they are the most authentic, built on a die-hard commitment to values and purpose. That belief runs past the day job. Mike serves on the boards of Conscious Capitalism Arizona and Social Venture Partners Arizona, co-founded the Thrive PHX nonprofit, and co-directed PHX Startup Week. The Arizona Republic named him one of the state's top 35 entrepreneurs under 35, and the Phoenix Business Journal put him on its 40 Under 40.`}
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
          <h2 className="mt-2 font-serif text-3xl">Two shows to book Mike on</h2>

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
                  <span className="font-medium">Why Mike fits: </span>
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
