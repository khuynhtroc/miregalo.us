import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SITE_URL } from '@/lib/urls';
import { stripHtml } from '@/lib/format';

export const dynamic = 'force-dynamic';

function cleanPrice(priceRaw?: string, currencyRaw?: string): string {
  if (!priceRaw) return '29.99 EUR';
  const num = parseFloat(priceRaw.replace(/[^0-9,.]/g, '').replace(',', '.')) || 29.99;
  const curr = currencyRaw || (priceRaw.includes('€') ? 'EUR' : priceRaw.includes('$') ? 'USD' : 'EUR');
  return `${num.toFixed(2)} ${curr}`;
}

function cleanImageUrl(rawUrl?: string): string {
  if (!rawUrl) return `${SITE_URL}/favicon.png`;
  let url = rawUrl.trim();
  url = url.replace(/https?:\/\/storage\.googleapis\.com\/loveable\.appspot\.com\//gi, 'https://media.miregalo.us/media/');
  url = url.replace(/https?:\/\/loveable\.appspot\.com\//gi, 'https://media.miregalo.us/media/');
  if (!url.startsWith('http')) {
    url = `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  }
  return url;
}

function cleanDescription(rawDesc?: string, title?: string): string {
  let desc = stripHtml(rawDesc || '')
    .replace(/storage\.googleapis\.com\/loveable\.appspot\.com/gi, 'media.miregalo.us/media')
    .replace(/loveable\.appspot\.com/gi, 'media.miregalo.us')
    .replace(/loveable\.(us|ai)/gi, 'miregalo.us')
    .replace(/loveable/gi, 'Miregalo')
    .trim();
  if (desc.length < 20) {
    desc = `${title} - Selección oficial en Miregalo.`;
  }
  return desc.slice(0, 4500);
}

function escapeCsv(field: string): string {
  if (!field) return '""';
  const clean = field.replace(/"/g, '""').replace(/[\r\n]+/g, ' ');
  return `"${clean}"`;
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

    const headers = [
      'id',
      'title',
      'description',
      'link',
      'image_link',
      'price',
      'availability',
      'condition',
      'brand',
      'google_product_category',
    ].join(',');

    const rows = products
      .filter((p: any) => p && p.slug && p.name)
      .map((p: any) => {
        const id = p.id || p.slug;
        const title = stripHtml(p.name || '')
          .replace(/loveable/gi, 'Miregalo')
          .slice(0, 150);
        const desc = cleanDescription(p.description, title);
        const link = `${SITE_URL}/p/${p.slug}/`;
        const imageLink = cleanImageUrl(p.image);
        const price = cleanPrice(p.price, p.currency);
        const availability = 'in stock';
        const condition = 'new';
        const brand = stripHtml(p.merchant || 'Amazon España')
          .replace(/loveable/gi, 'Miregalo Selección')
          .slice(0, 70);
        const googleCategory = 'Home & Garden';

        return [
          escapeCsv(id),
          escapeCsv(title),
          escapeCsv(desc),
          escapeCsv(link),
          escapeCsv(imageLink),
          escapeCsv(price),
          escapeCsv(availability),
          escapeCsv(condition),
          escapeCsv(brand),
          escapeCsv(googleCategory),
        ].join(',');
      });

    const csvContent = [headers, ...rows].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
      },
    });
  } catch (err: any) {
    console.error('[Pinterest Catalog CSV Feed Error]:', err);
    return new NextResponse(`error,${escapeCsv(err.message)}`, {
      status: 500,
      headers: { 'Content-Type': 'text/csv; charset=utf-8' },
    });
  }
}
