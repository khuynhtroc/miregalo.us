import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SITE_URL } from '@/lib/urls';
import { stripHtml } from '@/lib/format';

export const dynamic = 'force-dynamic';

function cleanXmlString(str: string): string {
  return (str || '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

function xmlEscape(str: string): string {
  return cleanXmlString(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cdata(str: string): string {
  const clean = cleanXmlString(str).replace(/]]>/g, ']]]]><![CDATA[>');
  return `<![CDATA[${clean}]]>`;
}

function cleanPrice(priceRaw?: string, currencyRaw?: string): string {
  if (!priceRaw) return '29.99 EUR';
  const num = parseFloat(priceRaw.replace(/[^0-9,.]/g, '').replace(',', '.')) || 29.99;
  const curr = currencyRaw || (priceRaw.includes('€') ? 'EUR' : priceRaw.includes('$') ? 'USD' : 'EUR');
  return `${num.toFixed(2)} ${curr}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limitParam = parseInt(searchParams.get('limit') || '5000', 10);
  const limit = Math.min(Math.max(limitParam, 50), 10000);
  const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);

  const batchSize = 1000;
  const numBatches = Math.ceil(limit / batchSize);
  const baseOffset = (page - 1) * limit;

  try {
    const batches = await Promise.all(
      Array.from({ length: numBatches }, (_, i) =>
        db.find('products', {
          eq: { active: true },
          order: [
            { field: 'clicks', asc: false },
            { field: 'updated_at', asc: false },
          ],
          offset: baseOffset + i * batchSize,
          limit: batchSize,
        })
      )
    );

    const products = batches.flatMap((b) => b.rows || []).slice(0, limit);

    const itemsXml = products
      .filter((p: any) => p && p.slug && p.name)
      .map((p: any) => {
        const title = stripHtml(p.name || '').slice(0, 150);
        const rawDesc = stripHtml(p.description || '');
        const desc = rawDesc.length > 20
          ? rawDesc.slice(0, 4500)
          : `${title} - Recomendación exclusiva disponible en Miregalo. Encuentra los mejores regalos e ideas originales con precios actualizados.`;
        const link = `${SITE_URL}/p/${p.slug}/`;
        const imageLink = p.image && p.image.startsWith('http')
          ? p.image
          : `${SITE_URL}${p.image?.startsWith('/') ? '' : '/'}${p.image || 'favicon.png'}`;
        const price = cleanPrice(p.price, p.currency);
        const brand = stripHtml(p.merchant || 'Amazon España').slice(0, 70);

        return `    <item>
      <g:id>${cdata(p.id || p.slug)}</g:id>
      <g:title>${cdata(title)}</g:title>
      <g:description>${cdata(desc)}</g:description>
      <g:link>${xmlEscape(link)}</g:link>
      <g:image_link>${xmlEscape(imageLink)}</g:image_link>
      <g:price>${price}</g:price>
      <g:availability>in stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>${cdata(brand)}</g:brand>
      <g:google_product_category>Home &amp; Garden</g:google_product_category>
      <g:identifier_exists>no</g:identifier_exists>
    </item>`;
      })
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Miregalo - Catálogo de Productos y Regalos</title>
    <link>${xmlEscape(SITE_URL)}</link>
    <description>Catálogo oficial de productos de afiliados y guías de regalos para Pinterest</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${itemsXml}
  </channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
      },
    });
  } catch (err: any) {
    console.error('[Pinterest Catalog Feed Error]:', err);
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><error>${xmlEscape(err.message)}</error>`, {
      status: 500,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }
}
