import { notFound } from 'next/navigation';
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

/**
 * Print-optimized A4 variant. Black-and-cream only (no terracotta) for print
 * readability. Page break before past appearances. Rendered to PDF by
 * /api/one-pager/[slug]/generate via Puppeteer.
 */
export default async function MediaPrintPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await loadBySlug(slug);
  if (!data) notFound();

  const { profile, user } = data;
  const name = user?.fullName || profile.company || 'Guest';
  const angles = profile.angles ?? [];
  const appearances = profile.pastAppearances ?? [];
  const questions = profile.sampleQuestions ?? [];

  return (
    <div
      style={{
        background: '#FAF6F0',
        color: '#1c1917',
        fontFamily: 'Georgia, serif',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
        minHeight: '100vh',
      }}
    >
      <style>{`
          @page { size: A4; margin: 0; }
          body { margin: 0; background: #FAF6F0; }
          .page-break { break-before: page; }
          h1,h2,h3 { font-family: 'DM Serif Display', Georgia, serif; }
          .body { font-family: 'DM Sans', Arial, sans-serif; }
        `}</style>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 40px' }}>
          <header style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            {profile.headshotUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.headshotUrl}
                alt={name}
                style={{ width: 110, height: 110, borderRadius: '50%', objectFit: 'cover' }}
              />
            )}
            <div>
              <h1 style={{ fontSize: 34, margin: 0 }}>{name}</h1>
              {profile.oneLineBio && (
                <p className="body" style={{ margin: '6px 0 0', fontSize: 16, color: '#44403c' }}>
                  {profile.oneLineBio}
                </p>
              )}
              {profile.company && (
                <p className="body" style={{ margin: '4px 0 0', fontSize: 12, letterSpacing: 1 }}>
                  {profile.company.toUpperCase()}
                </p>
              )}
            </div>
          </header>

          {profile.longBio && (
            <section style={{ marginTop: 32 }}>
              <h2 style={{ fontSize: 22 }}>About</h2>
              <p className="body" style={{ lineHeight: 1.6, color: '#292524', whiteSpace: 'pre-line' }}>
                {profile.longBio}
              </p>
            </section>
          )}

          {angles.length > 0 && (
            <section style={{ marginTop: 28 }}>
              <h2 style={{ fontSize: 22 }}>Topics</h2>
              {angles.map((a, i) => (
                <div key={i} style={{ marginTop: 12 }}>
                  <h3 style={{ fontSize: 15, margin: 0 }}>{a.title}</h3>
                  <p className="body" style={{ margin: '4px 0 0', fontSize: 13, color: '#44403c' }}>
                    {a.description}
                  </p>
                </div>
              ))}
            </section>
          )}

          {questions.length > 0 && (
            <section style={{ marginTop: 28 }}>
              <h2 style={{ fontSize: 22 }}>Questions to ask</h2>
              <ul className="body" style={{ color: '#292524', lineHeight: 1.6 }}>
                {questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </section>
          )}

          {appearances.length > 0 && (
            <section className="page-break" style={{ marginTop: 28 }}>
              <h2 style={{ fontSize: 22 }}>Past appearances</h2>
              <ul className="body" style={{ color: '#292524', lineHeight: 1.6 }}>
                {appearances.map((a, i) => (
                  <li key={i}>
                    {a.podcastName}
                    {a.episodeUrl ? ` · ${a.episodeUrl}` : ''}
                    {a.date ? ` (${a.date})` : ''}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <footer
            className="body"
            style={{ marginTop: 48, borderTop: '1px solid #d6d3d1', paddingTop: 16, fontSize: 11, color: '#78716c', textAlign: 'center' }}
          >
            podpick.com
          </footer>
        </div>
    </div>
  );
}
