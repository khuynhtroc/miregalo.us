import { NextResponse } from 'next/server';
import { getSettings, listPublishedPosts, getAuthors, getCategories } from '@/lib/repo';
import { SITE_URL, postPath } from '@/lib/urls';
import { rfc822, stripHtml } from '@/lib/format';

function cdata(str: string): string {
  return `<![CDATA[${(str || '').replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

export async function GET() {
  const [settings, { rows: posts }, authors, categories] = await Promise.all([
    getSettings(),
    listPublishedPosts({ perPage: 80, full: true }),
    getAuthors(),
    getCategories(),
  ]);

  const authorMap = new Map(authors.map((a) => [a.id, a.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const itemsXml = posts
    .filter((p) => !(p.robots && p.robots.toLowerCase().includes('noindex')))
    .map((p) => {
      const url = `${SITE_URL}${postPath(p)}`;
      const pubDate = rfc822(p.published_at || p.created_at);
      const authorName = (p.author_id && authorMap.get(p.author_id)) || 'Equipo Editorial Miregalo';

      let catName = 'Guías de Regalos';
      if (p.primary_category_id && categoryMap.has(p.primary_category_id)) {
        catName = categoryMap.get(p.primary_category_id)!;
      } else if (p.category_ids?.length && categoryMap.has(p.category_ids[0])) {
        catName = categoryMap.get(p.category_ids[0])!;
      } else if (p.type === 'blog') {
        catName = 'Blog & Consejos';
      }

      const rawDesc = p.excerpt || p.seo_description || stripHtml(p.intro_html || p.content_html || '');
      const desc = rawDesc.length > 320 ? rawDesc.slice(0, 317) + '…' : rawDesc;

      let richBody = p.content_html || p.intro_html || desc;
      if (p.items?.length && (!p.content_html || p.content_html.length < 200)) {
        const itemsList = p.items
          .slice(0, 5)
          .map((it) => `<li><strong>${it.heading}</strong>: ${stripHtml(it.description_html || '')}</li>`)
          .join('');
        richBody = `${p.intro_html || ''}<ul>${itemsList}</ul>${p.content_html || ''}`;
      }

      let mediaTags = '';
      if (p.hero_image) {
        const heroUrl = p.hero_image.startsWith('http')
          ? p.hero_image
          : `${SITE_URL}${p.hero_image.startsWith('/') ? '' : '/'}${p.hero_image}`;
        const mimeType = heroUrl.endsWith('.png') ? 'image/png' : heroUrl.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
        mediaTags = `\n      <media:content url="${heroUrl}" medium="image"/>\n      <enclosure url="${heroUrl}" length="0" type="${mimeType}"/>`;
      }

      return `    <item>
      <title>${cdata(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator>${cdata(authorName)}</dc:creator>
      <category>${cdata(catName)}</category>
      <description>${cdata(desc)}</description>
      <content:encoded>${cdata(richBody)}</content:encoded>${mediaTags}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/rss.xsl"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${cdata(`${settings.site_name} - ${settings.site_tagline || 'Guías de Regalos & Blog'}`)}</title>
    <link>${SITE_URL}/</link>
    <description>${cdata(settings.site_description || 'Guías de regalos, recomendaciones e ideas para cada momento especial.')}</description>
    <language>es-ES</language>
    <copyright>${cdata(`© ${new Date().getFullYear()} ${settings.site_name}. Todos los derechos reservados.`)}</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${SITE_URL}/images/miregalo-logo.png</url>
      <title>${cdata(settings.site_name)}</title>
      <link>${SITE_URL}/</link>
    </image>
    <managingEditor>contacto@miregalo.us (Equipo Editorial Miregalo)</managingEditor>
    <webMaster>contacto@miregalo.us (Soporte Técnico Miregalo)</webMaster>
${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
