import type { Metadata } from 'next';

/**
 * Prospect strategy page — Bruce Reading, President & CEO of Act!.
 *
 * Same two-part layout as the Harbour Capital sample: a host-facing media kit,
 * then internal booking strategy (two recommended shows + two customized pitches
 * written to the house outreach framework).
 *
 * All biographical facts are drawn from public sources (Act! press/leadership
 * pages and a Jan 2026 Authority Magazine interview); nothing is invented. Per
 * house style there are no em dashes anywhere, and external copy never uses the
 * two-letter term for machine intelligence. Pitch episode hooks reference real,
 * verifiable episodes; PS lines stay bracketed for the booker to personalize.
 */

export const metadata: Metadata = {
  title: 'Bruce Reading | Podcast guest strategy',
  description:
    'President & CEO of Act!. Leading a nearly 40-year-old small-business CRM through the biggest technology transition in its history.',
};

const angles = [
  {
    title: 'Modernizing a 40-year-old software company',
    description:
      'What it takes to reinvent a legacy product for how small businesses sell today, without losing the loyal customers who built the company.',
  },
  {
    title: 'Listen-first leadership',
    description:
      'Why silence in a meeting is a danger sign, not agreement, and how a leader makes it genuinely easy for people to tell them the truth.',
  },
  {
    title: 'Deciding with imperfect information',
    description:
      'Why a delayed decision usually costs more than a wrong one, and the humility to course-correct in public when the data turns.',
  },
];

const questions = [
  "You've led several software turnarounds. What is the first thing you look at when you walk into a company that has lost its way?",
  'You say a leader "cannot lead in fear." What does leading in confidence actually look like day to day?',
  'You discontinued a multi-million-dollar initiative. How do you make a call that big with incomplete information?',
  'Act! has served small businesses for almost 40 years. How has what they need from a CRM changed?',
  'What is a piece of conventional CEO advice you think is simply wrong?',
];

const shows = [
  {
    name: 'The Official SaaStr Podcast',
    host: 'Jason Lemkin',
    url: 'https://www.saastr.com/podcasts/',
    audience:
      'SaaS founders, operators, and executives focused on go-to-market, pricing, and scaling software companies.',
    why: 'Bruce is rebuilding the go-to-market and product of a legacy small-business SaaS in real time, with prior turnarounds at Volt Active Data, Pica9, and Perceptive Automata. He brings concrete operator war stories, not platitudes, to an audience that lives this.',
    anchor:
      'Episode anchor: "Sales + GTM in 2025/2026" (how SMB sales motions and the role of the rep are being rebuilt).',
  },
  {
    name: 'Coaching for Leaders',
    host: 'Dave Stachowiak',
    url: 'https://coachingforleaders.com/',
    audience:
      'Managers and senior leaders (50M+ downloads) who want practical, research-backed leadership and culture insight.',
    why: 'Bruce leads with exactly the principles this show teaches: listen far more than you speak, decide despite imperfect information, and lead from inside the work. He is living a real organizational change, which makes the lessons concrete rather than theoretical.',
    anchor:
      'Episode anchor: "How to Lead Organizational Change" with Michael Bungay Stanier.',
  },
];

const pitches = [
  {
    show: 'The Official SaaStr Podcast',
    subject: 'Jason <> Bruce intro',
    body: `Hi Jason - just caught your "Sales + GTM in 2025/2026" episode, and the stretch where you got into how SMB sales motions and the role of the rep are getting rebuilt from the ground up really landed for me.

That is the exact problem Bruce Reading is living right now. He is President and CEO of Act!, the small-business CRM that has been around almost 40 years, and he is rebuilding its go-to-market and product while keeping the customers who have been there for decades. Before Act! he ran turnarounds at Volt Active Data, Pica9, and Perceptive Automata, so he has operator war stories your founder audience would actually use.

Would you be interested in learning more about Bruce as a potential guest?

Alex

PS: [pull a specific detail from one of Jason's recent SaaStr posts or a running bit on the show]`,
  },
  {
    show: 'Coaching for Leaders',
    subject: 'Dave <> Bruce intro',
    body: `Hi Dave - I finally went through your episode with Michael Bungay Stanier on leading organizational change, and the idea of finding the good stuff that already works before you start ripping things out stuck with me.

That is basically Bruce Reading's playbook. He is President and CEO of Act!, where he is steering a nearly 40-year-old software company through the biggest change in its history, and he leads with a rule your audience would love: listen far more than you speak, because silence in a meeting is a danger sign, not agreement. He recently discontinued a multi-million-dollar initiative when the data turned, which is a great, concrete story about deciding under uncertainty.

Would you be interested in learning more about Bruce as a potential guest?

Alex

PS: [reference a recent Coaching for Leaders guest or one of Dave's Dale Carnegie roots]`,
  },
];

export default function ActCrmSamplePage() {
  const name = 'Bruce Reading';

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
              President and CEO of Act!. Leading a nearly 40-year-old small-business CRM through the
              biggest technology transition in its history.
            </p>
            <p className="mt-1 font-mono text-sm uppercase tracking-wide text-terracotta">
              Act! · Small-business CRM &amp; marketing automation · Phoenix, AZ
            </p>
          </div>
        </header>

        <section className="mt-12">
          <h2 className="font-serif text-2xl">About</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-stone-700">
            {`Bruce Reading is President and CEO of Act!, the CRM and marketing automation platform that has served small and mid-sized businesses for nearly four decades. He has spent more than thirty years leading software companies through market downturns, technology disruptions, and large-scale turnarounds, with prior CEO roles at Perceptive Automata, Pica9, and Volt Active Data.

He holds a bachelor's degree from McMaster University, an MBA from the University of Toronto, and completed the Advanced Management Program at Dartmouth's Tuck School. He is known for a candid, listen-first leadership style and a willingness to make hard calls: he recently discontinued a multi-million-dollar initiative and redirected the company's resources where they mattered more. As he put it in a recent interview, "You can't lead in fear. You have to lead in confidence, not arrogance, but a confidence rooted in listening, curiosity, and the humility to say, 'I didn't get this right. Let's pivot.'"`}
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
          <h2 className="mt-2 font-serif text-3xl">Two shows to book Bruce on</h2>

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
                  <span className="font-medium">Why Bruce fits: </span>
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
