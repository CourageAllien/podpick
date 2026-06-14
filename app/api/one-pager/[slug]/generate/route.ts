import { NextResponse, type NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { clientProfiles } from '@/db/schema';
import { generateOnePagerPDF } from '@/lib/pdf';

// Puppeteer needs the Node runtime.
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const profile = await db.query.clientProfiles.findFirst({
    where: eq(clientProfiles.slug, slug),
  });
  if (!profile) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const pdf = await generateOnePagerPDF({ slug });
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${slug}-one-pager.pdf"`,
      },
    });
  } catch (err) {
    console.error('One-pager PDF generation failed:', err);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
