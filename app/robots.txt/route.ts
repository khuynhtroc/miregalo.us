import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/repo';
import { SITE_URL } from '@/lib/urls';

export async function GET() {
  const settings = await getSettings();

  let body = 'User-agent: *\n';

  if (settings.noindex_site) {
    body += 'Disallow: /\n';
  } else {
    body += 'Allow: /\n';
    body += 'Disallow: /admin/\n';
    body += 'Disallow: /api/\n';
    body += 'Disallow: /go/\n';

    if (settings.robots_extra) {
      body += `\n${settings.robots_extra.trim()}\n`;
    }
  }

  body += `\nSitemap: ${SITE_URL}/sitemap.xml\n`;

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
