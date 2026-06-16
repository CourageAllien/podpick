import type { Metadata } from 'next';

/**
 * Prospect strategy page — Mike Qu, CEO of LeadGoals Accelerator (LGA Growth
 * Partners).
 *
 * Same two-part layout as the other samples: a host-facing media kit, then
 * internal booking strategy (two recommended shows + two customized pitches).
 *
 * Pitches follow the newer outreach guide:
 *   - Subject line: "[host first] <> Mike intro"
 *   - Greeting and a very specific episode/theme detail on the SAME line (no
 *     line break after the greeting), so the email reads well on a phone.
 *   - A relevancy paragraph that connects Mike's expertise to that detail,
 *     rather than praising how great he is.
 *   - CTA: "Would you be interested in learning more about Mike?"
 *   - Signature: "Mark".
 *   - A PS with a human, personal touch, kept bracketed for the booker to
 *     personalize from the host's LinkedIn or Instagram before sending.
 *
 * Facts are drawn from public sources (leadgoalsaccelerator.com,
 * lgagrowthpartners.io, and Mike's LinkedIn). His public profiles use "he." Per
 * house style there are no em dashes, and external copy never uses the
 * two-letter term for machine intelligence. The company's marketing claims
 * (e.g. guaranteed meetings) are framed as how the service is positioned, not
 * asserted as proven stats. Pitch hooks reference real, verifiable shows; the
 * exact episode detail and the PS stay editable for the booker.
 */

export const metadata: Metadata = {
  title: 'Mike Qu | Podcast guest strategy',
  description:
    'CEO of LeadGoals Accelerator. He builds relationship-first LinkedIn prospecting pipelines for financial advisors, by advisors, for advisors.',
};

const angles = [
  {
    title: 'Relationships over cold spam',
    description:
      'Why a referral-style prospecting pipeline on LinkedIn beats mass outreach, and how advisors build conversations that actually convert instead of getting ignored.',
  },
  {
    title: 'Lead gen built for compliance',
    description:
      'Why financial advisors need a different prospecting playbook than everyone else, and how to run consistent outreach that stays inside the rules.',
  },
  {
    title: 'From engineer to growth operator',
    description:
      'What a background at Twitter and Microsoft taught Mike about treating business development as a repeatable system rather than a motivation problem.',
  },
];

const questions = [
  'You came from engineering roles at Twitter and Microsoft. What does an engineer see in advisor prospecting that most marketers miss?',
  'Advisors are told to just post on LinkedIn. Why does that rarely turn into clients, and what works instead?',
  'You call your method Relationship-Gen, not lead gen. What is the actual difference?',
  'Financial services has strict compliance rules. How do you run outreach that stays inside them?',
  'If an advisor has one hour a week for business development, where should it go?',
];

const shows = [
  {
    name: 'Financial Advisor Marketing Podcast',
    host: 'James Pollard',
    url: 'https://www.theadvisorcoach.com/',
    audience:
      'Financial advisors focused on client acquisition (250+ episodes, one of the most established advisor-marketing shows) looking for practical, tested ways to get more clients.',
    why: 'Mike runs a done-for-you LinkedIn prospecting service built by advisors, for advisors. He maps directly onto the show’s core topic and brings a systematized, compliance-aware take that complements the host’s own LinkedIn views.',
    anchor:
      'Episode anchor: the show’s recurring case that advisors overcomplicate LinkedIn, try ten random tactics, and quit. Mike brings the relationship-first system that does not.',
  },
  {
    name: 'The Model FA Podcast',
    host: 'David DeCelle',
    url: 'https://themodelfa.libsyn.com/',
    audience:
      'Financial advisors building and scaling their practices, who tune in for growth strategy, prospecting, and the mindset behind a successful firm.',
    why: 'Mike works on the exact bottleneck this show keeps returning to: consistent prospecting and momentum. He brings a repeatable LinkedIn pipeline that does not depend on referrals or willpower holding up.',
    anchor:
      'Episode anchor: the show’s recurring thread on what actually holds advisors back from scaling. Mike brings the business-development engine side of that answer.',
  },
];

const pitches = [
  {
    show: 'Financial Advisor Marketing Podcast',
    subject: 'James <> Mike intro',
    body: `Hi James - your running point that advisors massively overcomplicate LinkedIn, try ten random tactics, get discouraged, and quit, is something I watch play out almost daily.

That gap is exactly what Mike Qu built a company to close. He is the CEO of LeadGoals Accelerator, a done-for-you prospecting service built by advisors, for advisors, that runs a relationship-first LinkedIn motion he calls Relationship-Gen instead of the spray-and-pray most advisors burn out on. Before this he was an engineer at Twitter and Microsoft, so he treats advisor prospecting as a system, not a hustle, and he keeps the whole thing inside financial-services compliance. Your audience would get a grounded, tactical take on what actually turns LinkedIn into booked appointments.

Would you be interested in learning more about Mike?

Mark

PS: [reference a recent Advisor Coach email or a James LinkedIn post to keep the open human]`,
  },
  {
    show: 'The Model FA Podcast',
    subject: 'David <> Mike intro',
    body: `Hi David - your recurring thread on what actually holds advisors back from scaling, the prospecting and momentum problem more than the planning skill, is one I keep nodding along to.

That is the exact problem Mike Qu works on. He is the CEO of LeadGoals Accelerator, where he builds LinkedIn prospecting pipelines for financial advisors using a relationship-first method rather than cold blasts, aiming for a steady flow of qualified conversations every week. He came out of engineering roles at Twitter and Microsoft, so he treats business development as a repeatable system, and he keeps it compliant for the financial-services world. Your advisor audience would get a concrete look at building momentum that does not depend on referrals drying up or motivation running out.

Would you be interested in learning more about Mike?

Mark

PS: [pull a recent Model FA moment or a detail from David's LinkedIn to personalize the open]`,
  },
];

export default function LeadGoalsAcceleratorSamplePage() {
  const name = 'Mike Qu';

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
              CEO of LeadGoals Accelerator. He builds relationship-first LinkedIn prospecting
              pipelines for financial advisors, by advisors, for advisors.
            </p>
            <p className="mt-1 font-mono text-sm uppercase tracking-wide text-terracotta">
              LeadGoals Accelerator · LinkedIn lead gen for financial advisors · Austin, TX · ex-Twitter
              &amp; Microsoft
            </p>
          </div>
        </header>

        <section className="mt-12">
          <h2 className="font-serif text-2xl">About</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-stone-700">
            {`Mike Qu is the CEO of LeadGoals Accelerator (also operating as LGA Growth Partners), a business-development firm that helps financial professionals fill their pipelines through relationship-first prospecting on LinkedIn. Based in Austin, Texas, he came up as a software engineer with roles at Twitter and Microsoft and a computer science degree from the University of Waterloo, and he brings that systems-minded approach to a corner of marketing that usually runs on hustle and guesswork.

LeadGoals is built around a simple idea Mike calls Relationship-Gen: instead of blasting cold messages, the system identifies the handful of relationships that can move an advisor's business and starts real conversations at a steady, manageable pace. The firm works specifically with financial advisors, along with mortgage and loan brokers and real estate developers, and it is designed from the ground up to stay inside financial-services compliance. The pitch to clients is grounded and operational: prospecting should be a predictable engine, not a feast-or-famine scramble, and the right few relationships can change the trajectory of a practice.`}
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
            Written to the outreach guide: a 5-second read, the greeting and a specific episode detail
            on one line, a relevancy connection to Mike’s expertise, a one-word-reply call to action,
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
