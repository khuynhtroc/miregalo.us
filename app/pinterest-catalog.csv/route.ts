import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SITE_URL } from '@/lib/urls';
import { stripHtml } from '@/lib/format';

export const dynamic = 'force-dynamic';

function parseNumericPrice(priceRaw?: string): number {
  if (!priceRaw) return 29.99;
  return parseFloat(priceRaw.replace(/[^0-9,.]/g, '').replace(',', '.')) || 29.99;
}

function cleanPrice(priceRaw?: string, currencyRaw?: string): string {
  const num = parseNumericPrice(priceRaw);
  const curr = currencyRaw || (priceRaw?.includes('€') ? 'EUR' : priceRaw?.includes('$') ? 'USD' : 'EUR');
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

function detectProductGroups(slug: string, name: string, priceNum: number) {
  const s = `${slug || ''} ${name || ''}`.toLowerCase();
  let productType = 'Regalos > Guías de Regalos';
  let topic = 'general';
  let recipient = 'unisex';

  if (s.includes('halloween')) {
    productType = 'Regalos > Halloween';
    topic = 'halloween';
  } else if (s.includes('navidad') || s.includes('navipapa') || s.includes('reyes')) {
    productType = 'Regalos > Navidad';
    topic = 'navidad';
  } else if (s.includes('san-valentin') || s.includes('valentin')) {
    productType = 'Regalos > San Valentín';
    topic = 'san-valentin';
  } else if (s.includes('boda') || s.includes('aniversario') || s.includes('compromiso')) {
    productType = 'Regalos > Bodas y Aniversarios';
    topic = 'aniversario';
  } else if (s.includes('mama') || s.includes('madre')) {
    productType = 'Regalos > Para Mamá';
    recipient = 'para-mama';
  } else if (s.includes('papa') || s.includes('padre')) {
    productType = 'Regalos > Para Papá';
    recipient = 'para-papa';
  } else if (s.includes('pareja') || s.includes('relationship') || s.includes('esposa') || s.includes('novio') || s.includes('novia') || s.includes('amor')) {
    productType = 'Regalos > Parejas';
    recipient = 'para-parejas';
  } else if (s.includes('mujer') || s.includes('women') || s.includes('chica')) {
    productType = 'Regalos > Para Ella';
    recipient = 'para-ella';
  } else if (s.includes('hombre') || s.includes('men') || s.includes('chico')) {
    productType = 'Regalos > Para Él';
    recipient = 'para-el';
  } else if (s.includes('animal') || s.includes('mascota') || s.includes('perro') || s.includes('gato')) {
    productType = 'Regalos > Mascotas';
    recipient = 'para-mascotas';
  } else if (s.includes('amig')) {
    productType = 'Regalos > Amigos';
    recipient = 'para-amigos';
  } else if (s.includes('cocina') || s.includes('cafe') || s.includes('gourmet') || s.includes('vino')) {
    productType = 'Regalos > Cocina y Gourmet';
    topic = 'hogar-gourmet';
  } else if (s.includes('deporte') || s.includes('outdoor') || s.includes('fitness')) {
    productType = 'Regalos > Deportes y Aire Libre';
    topic = 'deportes';
  }

  let priceTier = '20_a_50_eur';
  if (priceNum < 20) priceTier = 'menos_de_20_eur';
  else if (priceNum > 50) priceTier = 'mas_de_50_eur';

  const itemMatch = (slug || '').match(/^(.+)-item-\d+$/i);
  const itemGroupId = itemMatch ? itemMatch[1].replace(/^prod-/i, '') : (slug || '').replace(/^prod-/i, '');

  return { productType, topic, recipient, priceTier, itemGroupId };
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
      'product_type',
      'item_group_id',
      'custom_label_0',
      'custom_label_1',
      'custom_label_2',
      'custom_label_3',
      'custom_label_4',
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
        const priceNum = parseNumericPrice(p.price);
        const price = cleanPrice(p.price, p.currency);
        const availability = 'in stock';
        const condition = 'new';
        const brand = stripHtml(p.merchant || 'Amazon España')
          .replace(/loveable/gi, 'Miregalo Selección')
          .slice(0, 70);
        const googleCategory = 'Home & Garden';

        const groups = detectProductGroups(p.slug, p.name, priceNum);

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
          escapeCsv(groups.productType),
          escapeCsv(groups.itemGroupId),
          escapeCsv(groups.topic),
          escapeCsv(groups.recipient),
          escapeCsv(groups.priceTier),
          escapeCsv(brand),
          escapeCsv((p.clicks || 0) > 0 ? 'bestseller' : 'destacado'),
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
