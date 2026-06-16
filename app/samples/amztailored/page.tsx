import type { Metadata } from 'next';

/**
 * Prospect strategy page — Dana Mavros, founder & CEO of AMZTailored.
 *
 * Same two-part layout as the other samples: a host-facing media kit, then
 * internal booking strategy (two recommended shows + two customized pitches).
 *
 * Pitches follow the newer outreach guide:
 *   - Subject line: "[host first] <> Dana intro"
 *   - Greeting and a very specific episode/theme detail on the SAME line (no
 *     line break after the greeting), so the email reads well on a phone.
 *   - A relevancy paragraph that connects Dana's expertise to that detail,
 *     rather than praising how great she is.
 *   - CTA: "Would you be interested in learning more about Dana?"
 *   - Signature: "Mark".
 *   - A PS with a human, personal touch, kept bracketed for the booker to
 *     personalize from the host's LinkedIn or Instagram before sending.
 *
 * Facts are drawn from public sources (amztailored.com, Dana's LinkedIn, and a
 * prior podcast interview). Her public profiles use "she." Per house style
 * there are no em dashes, and external copy never uses the two-letter term for
 * machine intelligence. Pitch hooks reference real, verifiable shows; the exact
 * episode detail and the PS stay editable for the booker.
 */

export const metadata: Metadata = {
  title: 'Dana Mavros | Podcast guest strategy',
  description:
    'Founder and CEO of AMZTailored. A 25-year corporate executive turned Amazon operator who helps manufacturers and B2B brands grow on the marketplace.',
};

const angles = [
  {
    title: 'Manufacturers belong on Amazon',
    description:
      'Why legacy and B2B brands leave money on the table by treating Amazon as an afterthought, and what it takes to run the channel like a real line of business.',
  },
  {
    title: 'B2B on the world’s biggest marketplace',
    description:
      'How the Amazon B2B marketplace actually works, who is quietly winning on it, and why most agencies and sellers still ignore the opportunity.',
  },
  {
    title: 'From the boardroom to the Buy Box',
    description:
      'What 25 years as a corporate executive and an MBA in finance bring to running a brand’s Amazon P&L, beyond clicks and keyword rankings.',
  },
];

const questions = [
  'You spent 25 years as an executive in the electrical industry before Amazon. What translated, and what did you have to unlearn?',
  'Most manufacturers treat Amazon as a place to dump product. What are they missing?',
  'Everyone talks about consumer brands on Amazon. How big is the B2B opportunity, really?',
  'When a brand hands you a messy Amazon account, what is the first thing you fix?',
  'You have an MBA in finance. How does running the P&L change the way you build an Amazon strategy?',
];

const shows = [
  {
    name: 'Serious Sellers Podcast',
    host: 'Bradley Sutton',
    url: 'https://www.helium10.com/podcast/',
    audience:
      'Amazon and Walmart sellers of every level (the most-listened-to podcast for Amazon sellers, from Helium 10) hunting for real, tested strategies to grow.',
    why: 'Dana brings two things this audience rarely gets in one guest: an operator who runs brands’ Amazon P&Ls like a corporate executive, and a specialty in scaling manufacturer and B2B brands, not just consumer products.',
    anchor:
      'Episode anchor: the show’s recurring "scaling past seven figures" interviews, where growth comes from fixing account fundamentals. Dana brings the manufacturer and B2B version.',
  },
  {
    name: 'Ecommerce Braintrust',
    host: 'Julie Spear',
    url: 'https://www.ecommercebraintrust.com/',
    audience:
      'Established consumer brands and the operators growing them on Amazon and other marketplaces, focused on durable strategy over the latest tactic.',
    why: 'Dana takes legacy manufacturers onto Amazon for a living and speaks the language of brands that find the marketplace intimidating. Her B2B-marketplace focus and finance lens are a fresh angle for this brand-side audience.',
    anchor:
      'Episode anchor: the show’s running focus on building real momentum for established brands online. Dana brings the traditional-manufacturer-onto-Amazon playbook.',
  },
];

const pitches = [
  {
    show: 'Serious Sellers Podcast',
    subject: 'Bradley <> Dana intro',
    body: `Hi Bradley - your run of "scaling past seven figures" interviews, where the real growth turns out to come from fixing the unglamorous account fundamentals rather than one viral launch, is the version of this story I trust most.

That is the work Dana Mavros does every day. She is the founder and CEO of AMZTailored, a full-service agency that helps manufacturers and brands grow on Amazon, and she came to it after 25 years as a corporate executive in the electrical industry, with an MBA in finance from Chicago Booth. She runs a brand's Amazon presence like a P&L, and she has a specialty your audience rarely hears about: scaling B2B and manufacturer brands on the Amazon B2B marketplace. She would give your sellers a grounded look at the fundamentals that actually compound.

Would you be interested in learning more about Dana?

Mark

PS: [reference a recent Serious Sellers guest or a Bradley LinkedIn post to keep the open human]`,
  },
  {
    show: 'Ecommerce Braintrust',
    subject: 'Julie <> Dana intro',
    body: `Hi Julie - your running focus on helping established brands build real momentum on Amazon, instead of chasing the next shiny tactic, is exactly the conversation I wish more legacy manufacturers were hearing.

It is also Dana Mavros's whole world. She is the founder and CEO of AMZTailored, an agency built to help manufacturers sell more on Amazon, and she spent 25 years as an executive in the electrical industry first, so she speaks the language of the legacy brands that find the marketplace intimidating. She works the B2B side most agencies ignore, and she runs strategy through a finance lens with an MBA from Chicago Booth. Your brand-side audience would get a sharp take on bringing a traditional manufacturer onto Amazon without breaking what already works.

Would you be interested in learning more about Dana?

Mark

PS: [pull a recent Ecommerce Braintrust topic or a detail from Julie's LinkedIn to personalize the open]`,
  },
];

export default function AmzTailoredSamplePage() {
  const name = 'Dana Mavros';

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
              Founder and CEO of AMZTailored. A 25-year corporate executive turned Amazon operator who
              helps manufacturers and B2B brands grow on the marketplace.
            </p>
            <p className="mt-1 font-mono text-sm uppercase tracking-wide text-terracotta">
              AMZTailored · Full-service Amazon agency · Irvine, CA · MBA, Chicago Booth · B2B
              marketplace focus
            </p>
          </div>
        </header>

        <section className="mt-12">
          <h2 className="font-serif text-2xl">About</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-stone-700">
            {`Dana Mavros is the founder and CEO of AMZTailored, a full-service agency that helps manufacturers and brands sell more on Amazon. She came to e-commerce the long way: a 25-plus-year executive career in the electrical industry, including leadership roles at companies like Eaton, before stepping out of corporate America to build an agency. She holds an MBA in finance from the University of Chicago Booth School of Business and is based in Southern California.

AMZTailored runs the full Amazon stack for its clients, account management, advertising and SEO, brand strategy and registration, listing and storefront optimization, and consultancy, as a global, virtual team backed by more than a decade of hands-on selling on the platform. What sets Dana apart is the lens she brings to it: she treats a brand's Amazon channel like a real line of business with a P&L to defend, and she has a particular focus most agencies overlook, helping manufacturers and B2B brands grow on the Amazon B2B marketplace. Her view is straightforward: Amazon is not a side channel to dump inventory into, it is a market that rewards brands who run it with strategy and discipline.`}
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
          <h2 className="mt-2 font-serif text-3xl">Two shows to book Dana on</h2>

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
                  <span className="font-medium">Why Dana fits: </span>
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
            on one line, a relevancy connection to Dana’s expertise, a one-word-reply call to action,
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
