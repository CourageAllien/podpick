import type { Metadata } from 'next';

/**
 * Prospect strategy page — James Luctamar, founder & CEO of LuxN.
 *
 * Same two-part layout as the other samples: a host-facing media kit, then
 * internal booking strategy (two recommended shows + two customized pitches).
 *
 * Pitches follow the newer outreach guide:
 *   - Subject line: "[host first] <> James intro"
 *   - Greeting and a very specific episode/theme detail on the SAME line (no
 *     line break after the greeting), so the email reads well on a phone.
 *   - A relevancy paragraph that connects James's expertise to that detail,
 *     rather than praising how great he is.
 *   - CTA: "Would you be interested in learning more about James?"
 *   - Signature: "Mark".
 *   - A PS with a human, personal touch, kept bracketed for the booker to
 *     personalize from the host's LinkedIn or Instagram before sending.
 *
 * Facts are drawn from public sources (luxn.com, a WSFL TV "Life on Purpose"
 * interview, and James's LinkedIn). His public profiles use "he." Per house
 * style there are no em dashes, and external copy never uses the two-letter
 * term for machine intelligence. The company's marketing claims (guaranteed
 * placements, money-back model) are framed as how the service is positioned.
 * Pitch hooks reference real, verifiable shows; the exact episode detail and
 * the PS stay editable for the booker.
 */

export const metadata: Metadata = {
  title: 'James Luctamar | Podcast guest strategy',
  description:
    'Founder and CEO of LuxN, a PR firm built on guaranteed media placements. He helps founders and creators turn earned media into real authority.',
};

const angles = [
  {
    title: 'PR you can actually measure',
    description:
      'Why a guaranteed-placement, money-back model challenges the traditional PR retainer, and what it means to hold publicity to a real standard of results.',
  },
  {
    title: 'Earned media as authority',
    description:
      'How a founder or creator turns a feature in a major outlet into genuine credibility, aligned opportunities, and trust, instead of just a framed article.',
  },
  {
    title: 'Faith, heritage, and building global',
    description:
      'The immigrant founder story behind a worldwide PR firm: sacrifice, Haitian pride, and running a business on conviction when the outcome is never guaranteed.',
  },
];

const questions = [
  'You built a PR firm on guaranteed placements and refunds. What is broken about the traditional PR model?',
  'A founder gets featured in a major outlet. What separates the ones who turn it into real business from the ones who just frame the article?',
  'You serve clients across every continent. How does building authority look different from one market to the next?',
  'You came up as a Haitian immigrant, one of five brothers. How does that shape the way you run LuxN?',
  'You talk about walking by faith as an entrepreneur. How does that actually show up in your day-to-day decisions?',
];

const shows = [
  {
    name: 'Young and Profiting with Hala Taha',
    host: 'Hala Taha',
    url: 'https://youngandprofiting.com/',
    audience:
      'Entrepreneurs, marketers, and self-improvement-minded professionals (a top-ranked business podcast) who want actionable masterclasses they can use right away.',
    why: 'Hala built her own media and personal brand into the asset behind her business. James brings the earned-media lever that fuels exactly that, plus an immigrant founder story this audience leans into.',
    anchor:
      'Episode anchor: the show’s marketing and personal-brand masterclasses, and Hala’s own thesis that the brand and media come before the revenue. James brings the PR side.',
  },
  {
    name: 'The Influential Personal Brand Podcast',
    host: 'Rory Vaden',
    url: 'https://brandbuildersgroup.com/podcast/',
    audience:
      'Aspiring influencers, founders, speakers, authors, and experts (a top-100 business podcast) building reputation and revenue around a personal brand.',
    why: 'Brand Builders teaches that reputation precedes revenue. James delivers a concrete piece of that, getting people featured in major outlets, and his accountable, mission-driven story fits the show’s ethos.',
    anchor:
      'Episode anchor: the show’s core "reputation precedes revenue" thesis and finding your uniqueness to separate from the noise. James brings the earned-media half of it.',
  },
];

const pitches = [
  {
    show: 'Young and Profiting with Hala Taha',
    subject: 'Hala <> James intro',
    body: `Hi Hala - the way you keep coming back to the idea that you built YAP by treating your own brand and media as the real asset, long before the revenue showed up, is something I think about a lot.

That is the lever James Luctamar pulls for a living. He is the founder and CEO of LuxN, a PR firm that lands founders and creators in major outlets, and he built it on a model that breaks from traditional PR: guaranteed placements or your money back. He is also a Haitian immigrant, one of five brothers, who grew a firm that now works with clients across continents, so he brings both the tactical earned-media playbook and the founder story your audience leans in for. He would give your listeners a concrete take on turning press into real authority, not just a framed article.

Would you be interested in learning more about James?

Mark

PS: [reference a recent YAP guest or a detail from Hala's LinkedIn to keep the open human]`,
  },
  {
    show: 'The Influential Personal Brand Podcast',
    subject: 'Rory <> James intro',
    body: `Hi Rory - your core line that reputation precedes revenue, that people have to know and trust you before they ever buy, is basically the thesis my whole world runs on.

It is also what James Luctamar built a company around. He is the founder and CEO of LuxN, a PR firm that gets founders, creators, and experts featured in major publications to build exactly the authority you teach people to earn. His model is refreshingly accountable for the industry: guaranteed placements or a refund. And his own story, a Haitian immigrant who built a global firm on faith and a relentless work ethic, is the kind of mission-driven journey your audience connects with. He would give your listeners the earned-media side of building a personal brand that actually converts.

Would you be interested in learning more about James?

Mark

PS: [pull a recent Brand Builders moment or a detail from Rory's LinkedIn to personalize the open]`,
  },
];

export default function LuxnSamplePage() {
  const name = 'James Luctamar';

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
              Founder and CEO of LuxN, a PR firm built on guaranteed media placements. He helps
              founders and creators turn earned media into real authority.
            </p>
            <p className="mt-1 font-mono text-sm uppercase tracking-wide text-terracotta">
              LuxN · Digital PR &amp; guaranteed media placements · New York, NY · Founder, Luxntalent
            </p>
          </div>
        </header>

        <section className="mt-12">
          <h2 className="font-serif text-2xl">About</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-stone-700">
            {`James Luctamar is the founder and CEO of LuxN, a New York-based digital PR firm he started in 2020. LuxN exists to fix what frustrates people about traditional PR: it lands clients in major publications on a guaranteed-placement model, with a money-back promise if the coverage does not materialize. Over the last five years James has helped entrepreneurs, content creators, and businesses tell their stories across every continent, building the kind of authority that attracts aligned opportunities and accelerates credibility.

Behind the firm is a deeply personal story. James is a Haitian-born immigrant, one of five brothers, raised by parents who worked tirelessly after his father came to the United States in his early twenties. He carries that heritage and a faith-first philosophy into the business, often citing the idea of walking by faith, not by sight, as what entrepreneurship demands when the outcome is never guaranteed. In 2023 he launched a second venture, Luxntalent, an influencer talent company, extending the same mission of helping people get seen and heard into the creator economy.`}
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
          <h2 className="mt-2 font-serif text-3xl">Two shows to book James on</h2>

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
                  <span className="font-medium">Why James fits: </span>
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
            on one line, a relevancy connection to James’ expertise, a one-word-reply call to action,
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
