import type { Metadata } from 'next';

/**
 * Prospect reply page — Patrick Rafferty, RaffertyWeiss Media.
 *
 * Patrick replied to outreach asking three specific questions before he would
 * consider us. This page answers all three in order:
 *   1. Real pitch examples (representative samples for OpsBrain and Twogeder).
 *   2. A target list built for HIS niche: federal, nonprofit, and association
 *      decision-makers (generic business shows are explicitly off the table).
 *   3. What is included at $99/month, and that bookings are best-effort, not
 *      guaranteed.
 *
 * Audience figures are given as honest reach tiers; exact per-episode downloads
 * are confirmed in our podcast database before the list is finalized, which is
 * stated on the page. Per house style there are no em dashes, and external copy
 * never uses the two-letter term for machine intelligence.
 */

export const metadata: Metadata = {
  title: 'RaffertyWeiss × PodEngine | Your three questions, answered',
  description:
    'Pitch examples, a target list built for federal, nonprofit, and association decision-makers, and exactly what is included at $99/month.',
};

const samplePitches = [
  {
    client: 'OpsBrain',
    note: 'B2B operations platform · "The operational OS for human execution"',
    subject: 'Jordan <> OpsBrain founder intro',
    body: `Hi Jordan - your recent episode on why fast-growing teams drown in process debt, the one where you described work that lives across five tools and one person's memory, was painfully familiar.

That is the exact mess OpsBrain was built to clean up. We work with OpsBrain, the operational operating system for human execution, which turns the scattered checklists, handoffs, and tribal knowledge a scaling team runs on into one place where work actually ships. In one recent stretch it helped an agency stand up 11 new partner workflows in 60 days. OpsBrain's founder would give your operator audience a concrete execution framework, not another tool demo.

Would you be interested in learning more about OpsBrain's founder as a potential guest?

Alex`,
  },
  {
    client: 'Twogeder',
    note: 'Referral-partnership service for specialist businesses',
    subject: 'Priya <> Twogeder founder intro',
    body: `Hi Priya - I loved the moment in your partnerships episode where your guest said their referral channel quietly started outproducing paid ads, and nobody on the team saw it coming.

That is the entire premise of Twogeder, a client of ours. They build referral-partnership engines for specialist businesses: sourcing complementary partners, running the outreach, and booking the intro meetings, all on a flat monthly retainer instead of per-lead fees. One client put it simply: that channel now drives more demos than their paid ads. Twogeder's founder would give your audience a practical playbook for building a partner channel from zero.

Would you be interested in learning more about Twogeder's founder as a potential guest?

Alex`,
  },
];

const targets = [
  {
    segment: 'Federal',
    name: 'Federal Drive with Tom Temin',
    host: 'Tom Temin · Federal News Network',
    listeners:
      'Federal executives, agency leaders, and government contractors across the DC market.',
    reach: 'Large reach. Federal News Network flagship morning program (broadcast + podcast).',
  },
  {
    segment: 'Federal',
    name: 'GovExec Daily',
    host: 'Government Executive',
    listeners:
      'Federal managers and decision-makers nationwide who follow management, workforce, and policy.',
    reach: 'Mid reach. Daily show from a leading federal-government publication.',
  },
  {
    segment: 'Nonprofit',
    name: 'Nonprofits Are Messy',
    host: 'Joan Garry',
    listeners:
      'Nonprofit executive directors, CEOs, board members, and development leads.',
    reach: 'Large reach. One of the best-known nonprofit leadership shows, hundreds of episodes.',
  },
  {
    segment: 'Nonprofit',
    name: 'Tony Martignetti Nonprofit Radio',
    host: 'Tony Martignetti',
    listeners:
      'Nonprofit professionals across fundraising, governance, and communications.',
    reach: 'Mid-to-large reach. Weekly since 2010, broad nonprofit-professional base.',
  },
  {
    segment: 'Association',
    name: 'Associations Thrive',
    host: 'Joanna Pineda',
    listeners:
      'Association CEOs and executives focused on membership, revenue, and reinvention.',
    reach: 'Strong niche reach. A core show for the association-leadership community.',
  },
  {
    segment: 'Association',
    name: 'Association Chat',
    host: "KiKi L'Italien",
    listeners:
      'Association professionals and leaders tracking trends in member engagement and strategy.',
    reach: 'Strong niche reach. Long-running, influential host in the association industry.',
  },
];

const included = [
  'Guest positioning and a media kit page like this one, framed for federal, nonprofit, and association audiences.',
  'A researched target list kept strictly inside your niche, with who-listens detail on every show.',
  'Customized pitches written to our outreach framework, one per show, never a copy-paste blast.',
  'Ongoing outreach and follow-up, managed for you, so you are not chasing hosts.',
  'Reply handling and a warm handoff the moment a host says yes.',
  'A simple monthly summary of what went out, what came back, and what is booked.',
];

const segmentColors: Record<string, string> = {
  Federal: 'bg-terracotta/10 text-terracotta',
  Nonprofit: 'bg-emerald-100 text-emerald-700',
  Association: 'bg-indigo-100 text-indigo-700',
};

export default function RaffertyWeissSamplePage() {
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
        {/* ── HEADER ──────────────────────────────────────────── */}
        <header>
          <p className="font-mono text-xs uppercase tracking-widest text-stone-400">
            Prepared for Patrick Rafferty · RaffertyWeiss Media
          </p>
          <h1 className="mt-2 font-serif text-4xl">Your three questions, answered</h1>
          <p className="mt-3 text-lg text-stone-600">
            You said generic business shows will not move the needle, and you are right. Here are real
            pitch examples, a target list built only for federal, nonprofit, and association
            decision-makers, and exactly what $99/month buys.
          </p>
        </header>

        {/* ── 1 · PITCH EXAMPLES ──────────────────────────────── */}
        <section className="mt-14">
          <h2 className="font-serif text-3xl">1 · Pitch examples we have sent</h2>
          <p className="mt-2 text-sm text-stone-600">
            Representative samples for two of our clients. We have generalized the client-identifying
            details and the host names, but the structure, the specificity, and the voice are exactly
            what we send: a 5-second read, a real episode hook that proves we listened, a tight
            relevance connection, and a one-word-reply call to action.
          </p>

          <div className="mt-6 space-y-6">
            {samplePitches.map((p) => (
              <div
                key={p.client}
                className="overflow-hidden rounded-xl border border-stone-300 bg-white"
              >
                <div className="border-b border-stone-200 bg-stone-50 px-5 py-3">
                  <p className="font-mono text-xs uppercase tracking-wide text-stone-400">
                    Sample · client: {p.client}
                  </p>
                  <p className="mt-0.5 text-xs text-stone-500">{p.note}</p>
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
        </section>

        {/* ── 2 · TARGET LIST ─────────────────────────────────── */}
        <section className="mt-14">
          <h2 className="font-serif text-3xl">2 · A target list built for your niche</h2>
          <p className="mt-2 text-sm text-stone-600">
            A starter set of shows that actually reach federal, nonprofit, and association
            decision-makers. For RaffertyWeiss, the angle is Patrick on visual storytelling that moves
            mission-driven and public-sector audiences, drawn from 25 years and a roster that runs
            from Bill Gates to federal agencies. No generic business shows.
          </p>

          <div className="mt-6 space-y-4">
            {targets.map((t) => (
              <div key={t.name} className="rounded-xl border border-stone-200 bg-white/70 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-serif text-xl">{t.name}</h3>
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-mono text-xs uppercase tracking-wide ${
                      segmentColors[t.segment] ?? 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {t.segment}
                  </span>
                </div>
                <p className="mt-1 text-sm text-stone-500">{t.host}</p>
                <p className="mt-2 text-sm text-stone-700">
                  <span className="font-medium">Who listens: </span>
                  {t.listeners}
                </p>
                <p className="mt-1 text-sm text-stone-700">
                  <span className="font-medium">Audience: </span>
                  {t.reach}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-4 rounded-lg border border-stone-200 bg-white/60 p-4 text-xs text-stone-500">
            On audience size: the reach notes above are honest tiers, not guesses dressed up as
            precision. Before you approve a final list, we pull verified per-episode download numbers
            and listener demographics for each show from our podcast database, so you sign off on real
            figures, not marketing math.
          </p>
        </section>

        {/* ── 3 · PRICING & GUARANTEE ─────────────────────────── */}
        <section className="mt-14">
          <h2 className="font-serif text-3xl">3 · What $99/month includes</h2>

          <ul className="mt-4 space-y-2 text-stone-700">
            {included.map((item) => (
              <li key={item} className="flex gap-3 text-sm">
                <span aria-hidden className="mt-0.5 font-mono text-terracotta">
                  →
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-xl border-2 border-dashed border-stone-300 bg-white/60 p-6">
            <p className="font-mono text-xs uppercase tracking-widest text-stone-400">
              Booked vs best-effort
            </p>
            <p className="mt-2 text-sm leading-relaxed text-stone-700">
              Straight answer: bookings are pitched on a best-effort basis, not guaranteed. We do not
              pay hosts for placements, and anyone promising a guaranteed number of bookings for
              $99/month is selling you a spreadsheet of spam. What we commit to is consistent, genuinely
              customized outreach to the right shows in your niche, real reply handling, and full
              transparency on what went out and what came back. The pitches above are the quality bar
              we hold every month.
            </p>
          </div>
        </section>

        {/* ── CLOSE ───────────────────────────────────────────── */}
        <section className="mt-14 border-t border-stone-200 pt-8">
          <p className="text-stone-700">
            If the samples and the niche fit look right, the next step is a short call to lock your
            positioning and approve the first target list. Reply <span className="font-medium">yes</span>{' '}
            and we will send a couple of times.
          </p>
        </section>

        <footer className="mt-16 border-t border-stone-200 pt-6 text-center font-mono text-xs text-stone-400">
          Powered by PodEngine
        </footer>
      </div>
    </main>
  );
}
