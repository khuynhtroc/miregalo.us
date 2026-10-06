import { NextResponse } from 'next/server';
import { getSettings, listPublishedPosts } from '@/lib/repo';
import { SITE_URL, postPath } from '@/lib/urls';
import { escapeXml, rfc822 } from '@/lib/format';

export async function GET() {
  const [settings, { rows: posts }] = await Promise.all([
    getSettings(),
    listPublishedPosts({ perPage: 50 }),
  ]);

  const itemsXml = posts
    .map(
      (p) => `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${SITE_URL}${postPath(p)}</link>
      <guid>${SITE_URL}${postPath(p)}</guid>
      <description>${escapeXml(p.excerpt || p.seo_description)}</description>
      <pubDate>${rfc822(p.published_at || p.created_at)}</pubDate>
    </item>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(settings.site_name)}</title>
    <link>${SITE_URL}/</link>
    <description>${escapeXml(settings.site_description)}</description>
    <language>${settings.locale || 'en'}</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
