import type { Metadata } from 'next';

/**
 * Prospect strategy page — Daniel Wachtel, Harbour Capital Partners.
 *
 * Two halves:
 *  1. Public-facing media kit (the one-pager a host would see), mirroring the
 *     /m/[slug] design so it reads as a native PodEngine guest profile.
 *  2. Internal booking strategy — two recommended shows with rationale, and the
 *     two customized outreach pitches, written to the house outreach framework.
 *
 * All biographical facts are drawn from public sources (Harbour Capital Partners
 * press coverage and Daniel Wachtel's public profiles); nothing here is invented.
 * The pitch episode hooks reference real, verifiable episodes; the PS lines are
 * left as bracketed placeholders for the booker to personalize on a quick scan,
 * exactly as the outreach guide prescribes.
 */

export const metadata: Metadata = {
  title: 'Daniel Wachtel | Podcast guest strategy',
  description:
    'Founder of Harbour Capital Partners. Helping small and mid-sized businesses become investment-ready and raise capital.',
};

const angles = [
  {
    title: 'Getting investment-ready (before you raise)',
    description:
      'Why most small businesses fail to attract capital, and the honest gaps an advisor will not always name. What "ready" actually looks like to an investor.',
  },
  {
    title: 'Capital access for Main Street, not just Wall Street',
    description:
      'Private placements, DSCR loans, and creative financing for smaller operators and acquirers who get screened out by traditional lenders.',
  },
  {
    title: 'Honesty as a competitive edge in finance',
    description:
      'Building an advisory firm on telling clients the hard truth, even when it costs the engagement, and why integrity wins in investor relations.',
  },
];

const questions = [
  'What makes a small business genuinely "investment-ready," and where do most fall short?',
  'You tell clients the hard truth even when it costs you the deal. How did that become the model for the firm?',
  'For someone buying a business, what financing options beyond a standard SBA loan should they actually know about?',
  'What is the most common reason a capital raise falls apart that the founder never saw coming?',
  'How should a small or mid-cap fund think about investor relations differently than a large one?',
];

const shows = [
  {
    name: 'Acquiring Minds',
    host: 'Will Smith',
    url: 'https://acquiringminds.co/',
    audience:
      'Acquisition entrepreneurs buying small businesses, most of them financing the deal with SBA loans and weighing how to structure capital.',
    why: 'This is the exact table Daniel sits at. The audience is actively raising and structuring acquisition capital, screening for credit, and trying to become a credible buyer. His DSCR-loan and investor-readiness work maps one-to-one to their problems.',
    anchor:
      'Episode: "From SBA Loan to High 8-Figure Exit" with Jerod Pierce (HVAC acquisition, Sept 2025).',
  },
  {
    name: 'Built to Sell Radio',
    host: 'John Warrillow',
    url: 'https://builttosell.com/podcast/',
    audience:
      'Business owners preparing to sell or be acquired, focused on valuation, buyer psychology, and removing founder dependency.',
    why: 'Daniel gets hired to close the exact gap this show obsesses over: making a business attractive to a buyer or investor. His "I will tell you why you are not ready yet" approach is a natural fit for an exit-minded audience.',
    anchor:
      'Recurring theme: the "founder-dependent trap" that scares off serious buyers and caps valuation (2025 episodes).',
  },
];

const pitches = [
  {
    show: 'Acquiring Minds',
    subject: 'Will <> Dan intro',
    body: `Hi Will - just went through your episode "From SBA Loan to High 8-Figure Exit" with Jerod Pierce, and the part where he walks through financing the HVAC acquisition on an SBA loan, and what he wished he had understood about deal structure going in, really stuck with me.

I work with Daniel Wachtel, founder of Harbour Capital Partners. He spends his days on exactly that side of the table: getting operators investment-ready, structuring capital raises, and walking buyers through financing beyond a vanilla SBA loan, including DSCR options for people who get screened out on credit. Your acquisition-entrepreneur audience is the exact crowd he works with every week.

Would you be interested in learning more about Dan as a potential guest?

Alex

PS: [pull one specific detail from Will's recent LinkedIn or a recurring show in-joke after a quick scan]`,
  },
  {
    show: 'Built to Sell Radio',
    subject: 'John <> Dan intro',
    body: `Hi John - I was nodding through the stretch of your year-end episode on the "founder-dependent trap," where a business that runs entirely on the owner quietly scares off serious buyers and caps the valuation.

That is the exact gap Daniel Wachtel, founder of Harbour Capital Partners, gets hired to close. He tells owners the hard truth about why they are not investment-ready yet, even when it costs him the engagement, and then helps them fix it before they ever go to market. Your audience of owners eyeing an exit would get a lot from how he thinks about buyer-readiness.

Would you be interested in learning more about Dan as a potential guest?

Alex

PS: [reference one of John's books or a recent guest he clearly loved]`,
  },
];

export default function HarbourCapitalSamplePage() {
  const name = 'Daniel Wachtel';

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
              Founder of Harbour Capital Partners. Helping small and mid-sized businesses become
              investment-ready and raise the capital they need to grow.
            </p>
            <p className="mt-1 font-mono text-sm uppercase tracking-wide text-terracotta">
              Harbour Capital Partners · Philadelphia, PA
            </p>
          </div>
        </header>

        <section className="mt-12">
          <h2 className="font-serif text-2xl">About</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-stone-700">
            {`Daniel Wachtel founded Harbour Capital Partners in 2016 to help smaller businesses access the investment capital they need to grow. The firm advises on capital raises, private placements, mergers and acquisitions, investor relations, and turnarounds for distressed companies, and guides small and mid-cap funds on raising and reporting to limited partners. It also arranges DSCR loans for buyers who get screened out by traditional credit checks.

With over thirty years of combined experience and a background that runs through Morgan Stanley and the Monarch Value Fund, Daniel built the firm on a simple, unfashionable idea: tell clients the whole truth, even when it is hard. He will tell an owner they are not investment-ready, then help them get there, rather than chase a fee. As he puts it, "We aren't here to grab as much money as possible, we are here to truly help these businesses get to the next level."`}
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
          <h2 className="mt-2 font-serif text-3xl">Two shows to book Dan on</h2>

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
                  <span className="font-medium">Why Dan fits: </span>
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
