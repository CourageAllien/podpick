import type { Metadata } from 'next';
import IntakeForm from './intake-form';

export const metadata: Metadata = {
  title: 'Client intake | PodEngine',
  description:
    'Tell us about you and your goals so we can build your media kit, pick the right shows, and write pitches in your voice.',
};

export default function IntakePage() {
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
        <header>
          <p className="font-mono text-xs uppercase tracking-widest text-terracotta">
            PodEngine · Client intake
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">
            Let&rsquo;s build your podcast campaign.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-stone-600">
            The more you give us here, the better we pitch you. Your answers become your media page,
            the shortlist of shows we approach, and pitches written in your own voice, like the
            samples we shared. It takes about 10 to 15 minutes, and you can be as detailed as you
            like.
          </p>
          <p className="mt-3 text-sm text-stone-500">
            Not sure on an answer? Skip it. Only a few fields are required, and we will fill the
            gaps together.
          </p>
        </header>

        <div className="mt-12">
          <IntakeForm />
        </div>

        <footer className="mt-16 border-t border-stone-200 pt-6 text-center font-mono text-xs text-stone-400">
          Powered by PodEngine
        </footer>
      </div>
    </main>
  );
}
