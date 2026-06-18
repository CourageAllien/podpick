import type { Metadata } from 'next';

/**
 * Prospect strategy page — Bradley Jacobs, founder & CEO of Mylance.
 *
 * Same two-part layout as the other samples: a host-facing media kit, then
 * internal booking strategy (two recommended shows + two customized pitches
 * written to the house outreach framework).
 *
 * Facts are drawn from public sources (mylance.co, a Starter Story interview,
 * and RocketReach/LinkedIn). His public profiles use "he." Per house style there
 * are no em dashes, and external copy never uses the two-letter term for machine
 * intelligence. Pitch hooks reference real, verifiable shows; PS lines stay
 * bracketed for the booker to personalize.
 */

export const metadata: Metadata = {
  title: 'Bradley Jacobs | Podcast guest strategy',
  description:
    'Founder and CEO of Mylance. Helping experienced professionals turn their expertise into independent consulting clients, mostly on LinkedIn.',
};

const angles = [
  {
    title: 'From burned-out operator to independent',
    description:
      'How a senior tech professional replaces a salary with consulting income, and the first-client playbook: he landed a $25K-a-month client from a single LinkedIn message.',
  },
  {
    title: 'One product, one channel',
    description:
      'His rule for the first $1M in sales: build the smallest possible product, let customer feedback shape it, and commit to a single marketing channel instead of spreading thin.',
  },
  {
    title: 'Turning expertise into LinkedIn clients',
    description:
      'How independent consultants build a predictable pipeline instead of riding the feast-or-famine cycle, and why LinkedIn became the whole engine.',
  },
];

const questions = [
  'You left a senior Uber role to freelance. What is the very first move for someone who wants to do the same?',
  'Your first consulting client paid $25K a month after one LinkedIn message. What did you actually say?',
  'You tell founders to pick one product and one channel until $1M. Why is that focus so hard for smart people?',
  'Most consultants live in feast or famine. What actually builds a predictable pipeline?',
  'You bootstrapped Mylance to around $40K a month. What would you do differently if you started today?',
];

const shows = [
  {
    name: 'The Bootstrapped Founder',
    host: 'Arvid Kahl',
    url: 'https://thebootstrappedfounder.com/',
    audience:
      'Bootstrapped founders and solopreneurs learning to start, run, and sell businesses, build an audience, and build in public.',
    why: 'Bradley grew Mylance on essentially one channel, LinkedIn organic content, turning a personal audience into demand. That is the host’s "embedded entrepreneur" thesis in practice, with real numbers and a clean origin story behind it.',
    anchor:
      'Episode anchor: the host’s audience-driven business idea (build the audience first, then the exact product they are already asking you for).',
  },
  {
    name: 'Freelance to Founder',
    host: 'Preston Lee & Clay',
    url: 'https://freelancetofounder.com/',
    audience:
      'Real-life freelancers and independent consultants trying to escape the feast-or-famine cycle and grow beyond solo work.',
    why: 'This is the exact problem Bradley built a company to solve. He went from a senior Uber role to a $25K-a-month practice, then built Mylance to help others do the same. He can speak straight to the audience’s "where does the next client come from" anxiety.',
    anchor:
      'Episode anchor: the show’s running theme of escaping feast-or-famine by building a reliable client pipeline.',
  },
];

const pitches = [
  {
    show: 'The Bootstrapped Founder',
    subject: 'Arvid <> Bradley intro',
    body: `Hi Arvid - your "embedded entrepreneur" idea, building the audience first and then the exact product they are already asking you for, is something I wish more founders internalized.

That is more or less how Bradley Jacobs built Mylance. He left a senior role at Uber, started consulting (he landed his first client at $25K a month from a single LinkedIn message), and turned the demand from friends asking "how did you do that?" into a bootstrapped platform that helps experienced tech pros go independent. He grew it to around $40K a month on basically one channel, LinkedIn organic content, which is a great fit for your build-in-public audience. He also has a sharp rule: to get your first $1M, you need one product and one marketing channel.

Would you be interested in learning more about Bradley as a potential guest?

Alex

PS: [pull a specific detail from a recent Bootstrapped Founder episode or one of Arvid's posts on audience-building]`,
  },
  {
    show: 'Freelance to Founder',
    subject: 'Preston <> Bradley intro',
    body: `Hi Preston - the running theme on Freelance to Founder, helping people escape the feast-or-famine cycle and build something that outlasts the next gig, is exactly the problem I spend my days around.

It is also exactly what Bradley Jacobs built a company to solve. He is the founder and CEO of Mylance, which helps experienced professionals turn their expertise into a steady stream of LinkedIn clients instead of chasing one-off projects. He has lived it: he went from a senior Uber role to a $25K-a-month consulting practice, then built Mylance to help others do the same with guides, a vetted community, and a lead-generation system. Your callers wrestling with where the next client comes from would get a lot from how he thinks about pipeline.

Would you be interested in learning more about Bradley as a potential guest?

Alex

PS: [reference a recent Freelance to Founder call-in or one of Preston and Clay's own freelance origin stories]`,
  },
];

export default function MylanceSamplePage() {
  const name = 'Bradley Jacobs';

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
              Founder and CEO of Mylance. Helping experienced professionals turn their expertise into
              independent consulting clients, mostly on LinkedIn.
            </p>
            <p className="mt-1 font-mono text-sm uppercase tracking-wide text-terracotta">
              Mylance · Platform for independent consultants · Austin, TX · ex-Uber · Duke Engineering
            </p>
          </div>
        </header>

        <section className="mt-12">
          <h2 className="font-serif text-2xl">About</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-stone-700">
            {`Bradley Jacobs is the founder and CEO of Mylance, a platform that helps experienced professionals turn their expertise into independent consulting income. He spent four and a half years at Uber across Rides, Eats, and Freight before leaving to freelance, and from a single round of LinkedIn outreach he landed his first client at $25,000 a month, eventually building a consulting practice helping seed and Series A startups launch marketplaces. He holds an engineering degree from Duke University and is based in Austin, Texas.

Mylance grew out of the friends who kept asking how he did it. Today it gives self-employed consultants the guides, vetted community, and lead-generation tools to go independent and build a predictable pipeline, with a particular focus on tech professionals who have spent five to ten years or more at major companies and startups. Bootstrapped to roughly $40,000 a month in revenue, the business runs on lessons Bradley repeats often: build the smallest product you can and let customer feedback shape it, and to reach your first $1M, commit to one product and one marketing channel.`}
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
          <h2 className="mt-2 font-serif text-3xl">Two shows to book Bradley on</h2>

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
                  <span className="font-medium">Why Bradley fits: </span>
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
