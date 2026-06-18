import type { Metadata } from 'next';

/**
 * Prospect strategy page — Gary Cooper, founder & principal of Cooper CPA Group.
 *
 * Same two-part layout as the other samples: a host-facing media kit, then
 * internal booking strategy (two recommended shows + two customized pitches).
 *
 * Pitches follow the newer outreach guide:
 *   - Subject line: "[host first] <> Gary intro"
 *   - Greeting and a very specific episode/theme detail on the SAME line (no
 *     line break after the greeting), so the email reads well on a phone.
 *   - A relevancy paragraph that connects Gary's expertise to that detail,
 *     rather than praising how great he is.
 *   - CTA: "Would you be interested in learning more about Gary?"
 *   - Signature: "Mark".
 *   - A PS with a human, personal touch, kept bracketed for the booker to
 *     personalize from the host's LinkedIn or Instagram before sending.
 *
 * Facts are drawn from public sources (coopercpagroup.com and local press).
 * His public profiles use "he." Per house style there are no em dashes, and
 * external copy never uses the two-letter term for machine intelligence. Pitch
 * hooks reference real, verifiable shows and episodes; the exact episode detail
 * and the PS stay editable for the booker.
 */

export const metadata: Metadata = {
  title: 'Gary Cooper | Podcast guest strategy',
  description:
    'Founder and principal of Cooper CPA Group in Houston. A "Rock Star CPA" who helps business owners with proactive tax planning, succession, and exits.',
};

const angles = [
  {
    title: 'Planning beats tax season',
    description:
      'Why the real savings happen in the months before April, not the week of, and where owners quietly overpay every single year by waiting.',
  },
  {
    title: 'Build it to sell it',
    description:
      'Getting the books, the structure, and the succession plan ready so a transition or exit actually pays what the business is worth, instead of leaving money on the table.',
  },
  {
    title: 'The CPA as growth partner',
    description:
      'How the right financial guidance helps a small business grow and make better decisions, rather than just stay compliant and file on time.',
  },
];

const questions = [
  'A local station called you a "Rock Star CPA." What does a great CPA do that a tax-prep mill never will?',
  'Most owners only think about taxes in April. Where does that habit cost them the most?',
  'You handle succession planning and M&A. When should an owner start getting the financials ready for a sale?',
  'What is the most common bookkeeping mess you see, and how much is it really costing owners?',
  'You have served Houston business owners for more than two decades. What has changed about running a small business, and what never does?',
];

const shows = [
  {
    name: 'Built to Sell Radio',
    host: 'John Warrillow',
    url: 'https://builttosell.com/podcast/',
    audience:
      'Business owners thinking about selling or exiting, who tune in each week to hear founders break down what they did right and wrong through their own exit.',
    why: 'Gary does the exact pre-sale work this audience needs: succession planning, M&A guidance, and the financial readiness that decides a company’s value. He is the CPA side of the exit story the show tells from the founder’s seat.',
    anchor:
      'Episode anchor: the show’s recurring lesson that owners lose value at the closing table because the books were never built for a buyer to trust. Gary brings the fix.',
  },
  {
    name: 'The Small Business Radio Show',
    host: 'Barry Moltz',
    url: 'https://barrymoltz.com/small-business-radio-show/',
    audience:
      'Small business owners and entrepreneurs (one of the longest-running shows in the category) looking for straight, practical advice on running and growing a business.',
    why: 'The show regularly hosts CPAs and tax experts for its owner audience. Gary fits that slot with two decades of proactive tax-planning and growth-advisory work and a memorable "Rock Star CPA" hook.',
    anchor:
      'Episode anchor: the show’s tax-strategy episodes (e.g. "The Best Tax Strategies Every Small Business Owner Should Know"). Gary brings the plan-ahead, keep-more-of-it angle.',
  },
];

const pitches = [
  {
    show: 'Built to Sell Radio',
    subject: 'John <> Gary intro',
    body: `Hi John - the pattern that keeps surfacing across your post-exit interviews, that owners leave real money on the table because the books and financials were never built for a buyer to trust, is one I see from the accounting side constantly.

That is exactly the gap Gary Cooper helps owners close before they ever go to market. He is the founder of Cooper CPA Group in Houston, where he has spent more than two decades on tax planning, succession planning, and M&A guidance for business owners, the unglamorous financial readiness that decides what a company is actually worth at sale. He would give your audience a CPA's-eye view of what to clean up, and when to start, so an exit pays what the business is really worth.

Would you be interested in learning more about Gary?

Mark

PS: [reference a recent Built to Sell guest or a line from John's books to keep the open human]`,
  },
  {
    show: 'The Small Business Radio Show',
    subject: 'Barry <> Gary intro',
    body: `Hi Barry - your episode on the best tax strategies every small business owner should know, where the real takeaway was that the savings come from entity choices and clean books long before tax season, is a drum I would happily keep banging.

That proactive approach is how Gary Cooper has run Cooper CPA Group in Houston for over twenty years. He works with small and mid-sized business owners on tax planning, bookkeeping, and the financial strategy behind growth, and ABC's local affiliate has called him "Your Rock Star CPA." He is sharp on the difference between a tax-prep mill and a CPA who actually plans, and on where owners quietly overpay every year. Your audience would get practical, do-this-now guidance on keeping more of what they earn.

Would you be interested in learning more about Gary?

Mark

PS: [pull a recent Small Business Radio Show topic or a detail from Barry's LinkedIn to personalize the open]`,
  },
];

export default function CooperCpaGroupSamplePage() {
  const name = 'Gary Cooper';

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
              Founder and principal of Cooper CPA Group in Houston. A "Rock Star CPA" who helps
              business owners with proactive tax planning, succession, and exits.
            </p>
            <p className="mt-1 font-mono text-sm uppercase tracking-wide text-terracotta">
              Cooper CPA Group · Tax, accounting &amp; advisory · Houston, TX · 20+ years · QuickBooks
              Certified
            </p>
          </div>
        </header>

        <section className="mt-12">
          <h2 className="font-serif text-2xl">About</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-stone-700">
            {`Gary Cooper is the founder and principal of Cooper CPA Group, a Houston tax and accounting firm that has served the area for more than two decades. He works with small and mid-sized business owners, executives, and independent professionals, handling the full financial picture: tax preparation and planning, bookkeeping and accounting clean-up, financial statements and analysis, and QuickBooks consulting as a certified advisor.

Where Gary stands out is on the strategy side of the ledger. Beyond compliance, the firm guides owners through succession planning, mergers and acquisitions, and the kind of proactive tax planning that saves real money long before April. His view is that a good CPA is a growth partner, not a once-a-year filing service, and that the owners who plan ahead keep more of what they earn and build something worth more when it is time to sell or hand it on. The work has earned recognition, including being called "Your Rock Star CPA" by Houston's ABC affiliate and a spot among the city's best-reviewed CPA firms.`}
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
          <h2 className="mt-2 font-serif text-3xl">Two shows to book Gary on</h2>

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
                  <span className="font-medium">Why Gary fits: </span>
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
            on one line, a relevancy connection to Gary’s expertise, a one-word-reply call to action,
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
