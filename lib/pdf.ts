/**
 * PodPick — PDF generation for one-pager (V1)
 *
 * Renders the print-optimized media page (/m/[slug]/print) as a PDF.
 * Used by the positive-reply flow when a host requests the one-pager PDF.
 *
 * Usage:
 *   const pdf = await generateOnePagerPDF({ slug: 'sarah-lin' });
 *   // Upload to Supabase Storage or attach to email
 */

import puppeteer from 'puppeteer';

export type OnePagerPDFOptions = {
  slug: string;
  appUrl?: string;
  format?: 'A4' | 'Letter';
};

export async function generateOnePagerPDF(
  options: OnePagerPDFOptions
): Promise<Buffer> {
  const appUrl = options.appUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const printUrl = `${appUrl}/m/${options.slug}/print`;

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.goto(printUrl, { waitUntil: 'networkidle0', timeout: 30000 });

    const pdfBuffer = await page.pdf({
      format: options.format || 'A4',
      printBackground: true,
      margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    if (browser) await browser.close();
  }
}

/**
 * Generate + upload to Supabase Storage in one step.
 * Returns the public URL of the uploaded PDF.
 */
export async function generateAndUploadOnePagerPDF(params: {
  slug: string;
  clientProfileId: string;
}): Promise<{ url: string; pathInBucket: string }> {
  // Implementation depends on Supabase Storage setup
  // For now, returns the expected URL pattern; finalize in week 7 of build
  const _pdf = await generateOnePagerPDF({ slug: params.slug });

  // TODO: upload to Supabase Storage bucket 'one-pagers' at path `${clientProfileId}/${timestamp}.pdf`
  // const { data, error } = await supabase.storage.from('one-pagers').upload(...)

  throw new Error('Supabase Storage upload not yet implemented — wire in week 7');
}
