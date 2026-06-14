import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { clientProfiles, users } from '@/db/schema';

async function loadBySlug(slug: string) {
  const profile = await db.query.clientProfiles.findFirst({
    where: eq(clientProfiles.slug, slug),
  });
  if (!profile) return null;
  const user = await db.query.users.findFirst({ where: eq(users.id, profile.userId) });
  return { profile, user };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await loadBySlug(slug);
  if (!data) return { title: 'Not found' };
  const name = data.user?.fullName || data.profile.company || 'Guest';
  return {
    title: `${name} — Podcast guest`,
    description: data.profile.oneLineBio || undefined,
  };
}

export default async function MediaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await loadBySlug(slug);
  if (!data) notFound();

  const { profile, user } = data;
  const name = user?.fullName || profile.company || 'Guest';
  const angles = profile.angles ?? [];
  const appearances = profile.pastAppearances ?? [];
  const questions = profile.sampleQuestions ?? [];

  return (
    <main className="min-h-screen bg-cream text-stone-900">
      {/* Halftone dot accent */}
      <div
        aria-hidden
        className="h-2 w-full"
        style={{
          backgroundImage: 'radial-gradient(circle, #C76F4E 1px, transparent 1px)',
          backgroundSize: '10px 10px',
        }}
      />

      <div className="mx-auto max-w-3xl px-6 py-14">
        {/* Hero */}
        <header className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          {profile.headshotUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.headshotUrl}
              alt={name}
              className="h-32 w-32 rounded-full object-cover ring-4 ring-terracotta-200"
            />
          )}
          <div>
            <h1 className="font-serif text-4xl">{name}</h1>
            {profile.oneLineBio && (
              <p className="mt-2 text-lg text-stone-600">{profile.oneLineBio}</p>
            )}
            {profile.company && (
              <p className="mt-1 font-mono text-sm uppercase tracking-wide text-terracotta">
                {profile.company}
              </p>
            )}
          </div>
        </header>

        {/* About */}
        {profile.longBio && (
          <section className="mt-12">
            <h2 className="font-serif text-2xl">About</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-stone-700">
              {profile.longBio}
            </p>
          </section>
        )}

        {/* Topics / angles */}
        {angles.length > 0 && (
          <section className="mt-12">
            <h2 className="font-serif text-2xl">Topics</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {angles.map((a, i) => (
                <div key={i} className="rounded-lg border border-stone-200 bg-white/60 p-4">
                  <h3 className="font-medium">{a.title}</h3>
                  <p className="mt-2 text-sm text-stone-600">{a.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Past appearances */}
        {appearances.length > 0 && (
          <section className="mt-12">
            <h2 className="font-serif text-2xl">Past appearances</h2>
            <ul className="mt-4 space-y-2">
              {appearances.map((a, i) => (
                <li key={i} className="text-stone-700">
                  {a.episodeUrl ? (
                    <a href={a.episodeUrl} className="text-terracotta underline" target="_blank" rel="noreferrer">
                      {a.podcastName}
                    </a>
                  ) : (
                    a.podcastName
                  )}
                  {a.date && <span className="text-stone-400"> — {a.date}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Sample questions */}
        {questions.length > 0 && (
          <section className="mt-12">
            <h2 className="font-serif text-2xl">Questions to ask</h2>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-stone-700">
              {questions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          </section>
        )}

        {/* Booking CTA */}
        {profile.bookingLink && (
          <section className="mt-14 text-center">
            <a
              href={profile.bookingLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center justify-center rounded-md bg-terracotta px-8 font-medium text-white hover:bg-terracotta-600"
            >
              Book {name.split(' ')[0]}
            </a>
          </section>
        )}

        <footer className="mt-16 border-t border-stone-200 pt-6 text-center font-mono text-xs text-stone-400">
          Powered by PodEngine
        </footer>
      </div>
    </main>
  );
}
