import type { Metadata } from 'next';

/**
 * Prospect strategy page — Nayarit Briceño, CPA, founder of BW&T Business Advisors.
 *
 * Same two-part layout as the other samples: a host-facing media kit, then
 * internal booking strategy (two recommended shows + two customized pitches
 * written to the house outreach framework).
 *
 * Facts are drawn from public sources (the BW&T site, ZoomInfo, and LinkedIn).
 * The firm's own site refers to Nayarit as "her," so we follow that. Per house
 * style there are no em dashes, and external copy never uses the two-letter term
 * for machine intelligence. Pitch hooks reference real, verifiable episodes; PS
 * lines stay bracketed for the booker to personalize.
 */

export const metadata: Metadata = {
  title: 'Nayarit Briceño | Podcast guest strategy',
  description:
    'CPA and founder of BW&T Business Advisors. Helping entrepreneurs, and especially foreign-national and Latin American business owners, profit with peace of mind.',
};

const angles = [
  {
    title: 'Building a business that survives in a new country',
    description:
      'What immigrant and foreign-national founders need to know about US tax, entity structure, and asset protection from day one, before small mistakes become expensive ones.',
  },
  {
    title: 'Profit and peace of mind',
    description:
      'Why tax planning is not a once-a-year scramble, and how proactive planning quietly changes an owner’s entire year.',
  },
  {
    title: 'Protecting what you build',
    description:
      'Entity structuring, asset protection, and the real-estate decisions that quietly put a business owner at risk without them realizing it.',
  },
];

const questions = [
  'For an entrepreneur who just moved to the US, what is the first tax or structure decision they usually get wrong?',
  'What does genuinely proactive tax planning look like, versus what most small businesses actually do?',
  'When should a real estate owner separate properties into different entities, and when is that overkill?',
  "You've helped more than 600 businesses. What is the most common money blind spot you see?",
  'How do you keep a human touch in a field that people find intimidating?',
];

const shows = [
  {
    name: 'Main Street Business',
    host: 'Mark J. Kohler & Mat Sorensen',
    url: 'https://mainstreetbusiness.com/',
    audience:
      'Entrepreneurs, investors, and business owners who want to build, protect, and manage wealth through entity structuring, tax strategy, real estate, and asset protection.',
    why: 'Her expertise maps one-to-one to this show, and she adds what the hosts (attorneys) do not: the on-the-ground CPA view, plus an immigrant and foreign-national founder angle their audience rarely hears.',
    anchor:
      'Episode anchor: #568 "Asset Protection and Privacy: Reality or Illusion" (when to separate real estate into multiple LLCs).',
  },
  {
    name: 'Café con Pam',
    host: 'Pam Covarrubias',
    url: 'https://www.cafeconpam.com/',
    audience:
      'Latine and Latinx entrepreneurs and changemakers (400+ episodes) tuning in for conversations on money, business, and personal growth.',
    why: 'Her mission of helping Latina and Latin American owners structure and protect their businesses fits the audience and the values of this show exactly, with real financial depth behind the story.',
    anchor:
      'Episode anchor: the Edna Mariñelarena episode on financial literacy and being the family "financial floor."',
  },
];

const pitches = [
  {
    show: 'Main Street Business',
    subject: 'Mark & Mat <> Nayarit intro',
    body: `Hi Mark and Mat - just went through episode 568 on asset protection and privacy, and the part where Mat broke down when to separate real estate into multiple LLCs versus keeping them in one is exactly the conversation I have with clients every week.

I work with Nayarit Briceño, a CPA and founder of BW&T Business Advisors. She spends her days on the accountant's side of that same table: entity structuring, asset protection, and proactive tax planning for entrepreneurs, with a specialty in foreign nationals and Latin American owners building wealth in the US. She would give your audience the on-the-ground CPA view that pairs perfectly with your legal one.

Would you be interested in learning more about Nayarit as a potential guest?

Alex

PS: [pull a specific detail from a recent Main Street Business episode or one of Mark's tax tips]`,
  },
  {
    show: 'Café con Pam',
    subject: 'Pam <> Nayarit intro',
    body: `Hi Pam - I loved your episode with Edna Mariñelarena about becoming the "financial floor" for your family and why financial literacy hits different for women of color. It stuck with me all week.

That is the work Nayarit Briceño does every day. She is a CPA and founder of BW&T Business Advisors, and she helps Latina and Latin American entrepreneurs structure, protect, and grow their businesses in the US, with serious tax depth and a real human touch. Her own tagline is "your compass to profit and peace of mind," which feels right at home with your audience.

Would you be interested in learning more about Nayarit as a potential guest?

Alex

PS: [reference a recent Café con Pam guest or one of Pam's productivity rituals]`,
  },
];

export default function BwtAdvisorsSamplePage() {
  const name = 'Nayarit Briceño';

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
              CPA and founder of BW&amp;T Business Advisors. Helping entrepreneurs, and especially
              foreign-national and Latin American business owners, profit with peace of mind.
            </p>
            <p className="mt-1 font-mono text-sm uppercase tracking-wide text-terracotta">
              BW&amp;T Business Advisors · Tax, accounting &amp; advisory · Miramar, FL · CPA · EA · CAA · TRS
            </p>
          </div>
        </header>

        <section className="mt-12">
          <h2 className="font-serif text-2xl">About</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-stone-700">
            {`Nayarit Briceño is the founder and CEO of BW&T Business Advisors, a tax, accounting, and business-advisory firm in Miramar, Florida. A CPA with more than 25 years of experience across accounting, tax, and business consulting, she has helped over 600 clients improve their operations through tailored tax and financial planning.

She specializes in serving entrepreneurs and small and mid-sized business owners, with particular depth helping foreign nationals and Latin American owners structure, protect, and grow what they build in the US. The firm's promise, "Your Compass to Profit and Peace of Mind," reflects her approach: pair serious technical depth in entity structuring, asset protection, tax resolution, and real estate with a genuine human touch. She is also the founder of YourBizCompass Group.`}
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
          <h2 className="mt-2 font-serif text-3xl">Two shows to book Nayarit on</h2>

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
                  <span className="font-medium">Why Nayarit fits: </span>
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
          Powered by Podpick
        </footer>
      </div>
    </main>
  );
}
