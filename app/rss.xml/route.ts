import { NextRequest, NextResponse } from 'next/server';
import { getSettings, listPublishedPosts, getAuthors, getCategories } from '@/lib/repo';
import { SITE_URL, postPath } from '@/lib/urls';
import { rfc822, stripHtml } from '@/lib/format';
import type { Post } from '@/lib/types';

export const dynamic = 'force-dynamic';

function cdata(str: string): string {
  return `<![CDATA[${(str || '').replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;
}

function xmlAttr(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Resolves an absolute, high-quality image URL and appropriate MIME type for Pinterest RSS ingestion
 */
function resolveItemImage(p: Partial<Post>): { url: string; mimeType: string } {
  let rawUrl = (
    p.hero_image ||
    p.og_image ||
    (Array.isArray(p.items) ? p.items.find((it: any) => it?.image)?.image : '') ||
    ''
  ).trim();

  // Normalize legacy Google Cloud Storage or Loveable CDN URLs to media.miregalo.us
  if (rawUrl) {
    rawUrl = rawUrl
      .replace(/^https?:\/\/storage\.googleapis\.com\/loveable\.appspot\.com\//i, 'https://media.miregalo.us/media/')
      .replace(/^https?:\/\/loveable\.appspot\.com\//i, 'https://media.miregalo.us/media/')
      .replace(/^https?:\/\/cdn\.loveable\.us\//i, 'https://media.miregalo.us/media/');
  }

  // Ensure absolute HTTPS URL and fallback to high-res Miregalo cover
  if (!rawUrl) {
    rawUrl = `${SITE_URL}/images/miregalo-cover.jpg`;
  } else if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
    rawUrl = `${SITE_URL}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
  }

  const cleanPath = rawUrl.split('?')[0].toLowerCase();
  let mimeType = 'image/jpeg';
  if (cleanPath.endsWith('.png')) mimeType = 'image/png';
  else if (cleanPath.endsWith('.webp')) mimeType = 'image/webp';
  else if (cleanPath.endsWith('.gif')) mimeType = 'image/gif';

  return { url: rawUrl, mimeType };
}

export async function GET(request: NextRequest) {
  const urlObj = request ? new URL(request.url) : null;
  const typeParam = urlObj?.searchParams.get('type')?.toLowerCase();
  const limitParam = parseInt(urlObj?.searchParams.get('limit') || '200', 10);
  const targetLimit = Math.min(Math.max(limitParam || 200, 20), 500);

  const [settings, authors, categories] = await Promise.all([
    getSettings(),
    getAuthors(),
    getCategories(),
  ]);

  const authorMap = new Map(authors.map((a) => [a.id, a.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  let posts: Post[] = [];

  if (typeParam === 'gift' || typeParam === 'giftguide' || typeParam === 'regalos') {
    // Chỉ lấy bài Gift Guides
    const res = await listPublishedPosts({ type: 'gift', perPage: targetLimit, full: false });
    posts = res.rows;
  } else if (typeParam === 'blog' || typeParam === 'news') {
    // Chỉ lấy bài Blog & Tin tức
    const res = await listPublishedPosts({ type: 'blog', perPage: targetLimit, full: false });
    posts = res.rows;
  } else {
    // Mặc định: Phân bổ cân bằng cả Gift Guides VÀ Blog & News mới nhất
    const half = Math.ceil(targetLimit / 2);
    const [giftRes, blogRes] = await Promise.all([
      listPublishedPosts({ type: 'gift', perPage: half, full: false }),
      listPublishedPosts({ type: 'blog', perPage: half, full: false }),
    ]);

    // Gộp và sắp xếp theo ngày xuất bản mới nhất
    const combinedMap = new Map<string, Post>();
    for (const p of [...giftRes.rows, ...blogRes.rows]) {
      combinedMap.set(p.id, p);
    }

    posts = Array.from(combinedMap.values()).sort(
      (a, b) => new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime()
    );
  }

  // Lọc an toàn: loại bỏ trang legal/page, noindex và các stubs không có nội dung
  const filteredPosts = posts.filter((p) => {
    if (p.type === 'page') return false;
    if (p.robots && p.robots.toLowerCase().includes('noindex')) return false;
    if (p.slug && p.slug.startsWith('regalos-') && !p.hero_image && (!p.excerpt || p.excerpt.length < 20)) {
      return false;
    }
    return true;
  });

  const itemsXml = filteredPosts
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

      const { url: heroUrl, mimeType } = resolveItemImage(p);
      const safeHeroUrl = xmlAttr(heroUrl);

      // Media RSS tags (Pinterest compliant - non-zero length and explicit media:content + thumbnail)
      const mediaTags = `
      <media:content url="${safeHeroUrl}" medium="image" type="${mimeType}">
        <media:title>${cdata(p.title)}</media:title>
        <media:description>${cdata(desc)}</media:description>
        <media:thumbnail url="${safeHeroUrl}"/>
      </media:content>
      <enclosure url="${safeHeroUrl}" length="150000" type="${mimeType}"/>`;

      // Rich body with embedded image for maximal RSS consumer compatibility
      const richBody = `<p><img src="${safeHeroUrl}" alt="${xmlAttr(p.title)}" style="max-width:100%;height:auto;border-radius:8px;"/></p>\n<p>${desc}</p>` +
        (p.intro_html ? `\n${p.intro_html}` : '');

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
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
