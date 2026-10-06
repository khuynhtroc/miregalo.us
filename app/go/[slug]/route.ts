import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  let product = await db.findOne('products', { slug, active: true });
  let destUrl = product?.url;

  if (!destUrl) {
    // Check if there is a redirect rule for this /go/ slug
    const redirectRule =
      (await db.findOne('redirects', { source: `/go/${slug}/`, active: true })) ||
      (await db.findOne('redirects', { source: `/go/${slug}`, active: true }));

    if (redirectRule) {
      destUrl = redirectRule.destination;
      try {
        await db.increment('redirects', redirectRule.id, 'hits');
      } catch {}
    }
  }

  if (!destUrl) {
    // Fallback to default featured affiliate product
    const fallback = await db.findOne('products', { slug: 'amazon-regalo-destacado', active: true });
    destUrl = fallback?.url || 'https://www.amazon.es/?tag=giftblog-21';
  }

  // Atomically increment click counter if product exists
  if (product) {
    try {
      await db.increment('products', product.id, 'clicks');
    } catch {}
  }

  if (product?.merchant_id) {
    try {
      const merchant = await db.findOne('merchants', { id: product.merchant_id });
      if (merchant && merchant.affiliate_param && !destUrl.includes(merchant.affiliate_param)) {
        const sep = destUrl.includes('?') ? '&' : '?';
        destUrl = `${destUrl}${sep}${merchant.affiliate_param}`;
      }
    } catch {}
  }

  return NextResponse.redirect(destUrl, 302);
}
