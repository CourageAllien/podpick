import type { Metadata } from 'next';

/**
 * Prospect strategy page — Dave O'Rourke, Chief Strategy Officer of Socialistics.
 *
 * Same two-part layout as the other samples: a host-facing media kit, then
 * internal booking strategy (two recommended shows + two customized pitches
 * written to the house outreach framework).
 *
 * Per the booker's note for this prospect, each pitch is built around a real,
 * specific past episode of the target show that Dave can offer a credible
 * alternative take on (a friendly counterpoint), not just praise.
 *
 * Facts are drawn from public sources (socialistics.com, ZoomInfo, and Dave's
 * LinkedIn). His public profiles use "he." Per house style there are no em
 * dashes, and external copy never uses the two-letter term for machine
 * intelligence. PS lines stay bracketed for the booker to personalize.
 */

export const metadata: Metadata = {
  title: "Dave O'Rourke | Podcast guest strategy",
  description:
    'Chief Strategy Officer at Socialistics. A four-time founder and growth leader who measures social media by revenue, not vanity metrics.',
};

const angles = [
  {
    title: 'Outbound is not dead',
    description:
      'How a well-built cold outreach motion still lands major partnerships in an inbound-obsessed world, and what separates the version that works from the spray-and-pray that does not.',
  },
  {
    title: 'Results over vanity metrics',
    description:
      'Why followers, views, and going viral are usually the wrong scoreboard, and what social media should actually be judged on: leads, customers, and sales.',
  },
  {
    title: 'Building the growth engine',
    description:
      'What a four-time founder and former Head of Growth learned about turning a creative service business into a deliberate, predictable revenue machine.',
  },
];

const questions = [
  'Everyone says cold outreach is dead. You used it to land a major partnership. What did you do differently?',
  'Most brands chase followers and views. Why is that the wrong goal, and what should they measure instead?',
  'You have founded four companies. What did the failures teach you that the wins never could?',
  'As Head of Growth turned Chief Strategy Officer, how did you build a real sales motion inside a creative agency?',
  'When a client says "we want to go viral," what do you actually tell them?',
];

const shows = [
  {
    name: 'Social Media Marketing Podcast',
    host: 'Michael Stelzner & Jerry Potter',
    url: 'https://www.socialmediaexaminer.com/podcast/',
    audience:
      'Marketers, social media managers, and agency owners (millions of downloads a year) hunting for new strategies and actionable tactics.',
    why: 'Dave offers the counterpoint this audience rarely hears: views and followers are the wrong scoreboard, and he runs a real agency P&L that proves results beat reach. A friendly, evidence-backed challenge to the "go viral" instinct.',
    anchor:
      'Episode to answer: the recent "200-view jail" episode on beating the algorithm to rack up views and grow an audience. Dave argues for chasing revenue instead.',
  },
  {
    name: 'The Revenue Formula',
    host: 'Toni Hohlbein & Mikkel Plaehn',
    url: 'https://www.youtube.com/@revenueformula',
    audience:
      'B2B founders, RevOps, and sales and marketing leaders working the full funnel and scaling go-to-market.',
    why: 'Dave is a four-time founder and former Head of Growth who built a cold outreach motion that landed a major partnership. He can take the other side of the outbound debate with receipts: not dead, just done badly.',
    anchor:
      'Episode to answer: "How to not do outbound in 2025 (and what to do instead)," on the brute-force approach breaking down. Dave brings the version that still works.',
  },
];

const pitches = [
  {
    show: 'Social Media Marketing Podcast',
    subject: 'Mike <> Dave intro',
    body: `Hi Mike - I just listened to your recent episode on escaping "200-view jail" and beating the TikTok algorithm to rack up views and grow an audience, and it got me thinking you might enjoy a guest who would gently argue the other side.

That is Dave O'Rourke, Chief Strategy Officer at Socialistics. His whole pitch is that views and followers are usually the wrong scoreboard, and that social media should be judged on leads, customers, and sales. He is a four-time founder and the agency's former Head of Growth, so he is not theorizing, he runs a P&L on this. He would give your audience a friendly, evidence-backed counterpoint to the "go viral" instinct: what to chase instead when a business actually needs revenue.

Would you be interested in learning more about Dave as a potential guest?

Alex

PS: [pull a specific detail from a recent Social Media Marketing Podcast episode or one of Mike's Social Media Examiner reports]`,
  },
  {
    show: 'The Revenue Formula',
    subject: 'Toni <> Dave intro',
    body: `Hi Toni - your episode "How to not do outbound in 2025 (and what to do instead)," where you and Mikkel walk through how the brute-force outbound approach is breaking down, is one I have sent to a few people.

I think Dave O'Rourke would make a great counterpoint guest. He is Chief Strategy Officer at Socialistics and a four-time founder, and as the agency's former Head of Growth he built a cold outreach motion that landed a major partnership, right when everyone was declaring outbound dead. He agrees the spray-and-pray version is finished, but he can show your audience the alternative that still works: how a small, sharp team lands big partners on purpose. A real "here is what to do instead" to pair with the episode.

Would you be interested in learning more about Dave as a potential guest?

Alex

PS: [reference a recent Revenue Formula episode or one of Toni's Growblocks posts]`,
  },
];

export default function SocialisticsSamplePage() {
  const name = "Dave O'Rourke";

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
              Chief Strategy Officer at Socialistics. A four-time founder and growth leader who
              measures social media by revenue, not vanity metrics.
            </p>
            <p className="mt-1 font-mono text-sm uppercase tracking-wide text-terracotta">
              Socialistics · Social media marketing agency · Seattle, WA · GTM &amp; growth · ex-Head
              of Growth
            </p>
          </div>
        </header>

        <section className="mt-12">
          <h2 className="font-serif text-2xl">About</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-stone-700">
            {`Dave O'Rourke is the Chief Strategy Officer at Socialistics, the Seattle social media agency known for chasing real business results, leads, customers, and sales, rather than vanity metrics. A four-time founder and go-to-market leader, he has spent more than 12 years in business development and marketing across consumer goods, gaming, music, and retail tech, working with brands from Target to The Chainsmokers.

He joined Socialistics as Head of Growth, where he led the sales department and built a cold outreach motion that landed a major partnership at a moment when most of the industry had written outbound off. As Chief Strategy Officer he now owns cross-functional collaboration, executive relationships, and the agency's long-term growth strategy. His through-line is unfashionable and effective: ignore the applause metrics, build a deliberate engine, and judge marketing by the revenue it actually produces.`}
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
          <h2 className="mt-2 font-serif text-3xl">Two shows to book Dave on</h2>
          <p className="mt-2 text-sm text-stone-600">
            Both pitches lead with a real past episode and frame Dave as the friendly alternative
            take, not just another fan.
          </p>

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
                  <span className="font-medium">Why Dave fits: </span>
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
            we listened, the relevance connection, and a one-word-reply call to action. Each one names
            a real episode and offers a clear alternative take. Signature and PS are editable; confirm
            the exact episode detail on a listen before sending.
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
