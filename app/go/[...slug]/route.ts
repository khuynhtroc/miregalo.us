import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DEFAULT_SETTINGS } from '@/lib/settings-defaults';

interface AffiliatePlatformSettings {
  platforms?: {
    amazon?: { tagOrId?: string; active?: boolean };
    awin?: { tagOrId?: string; active?: boolean };
    ebay?: { tagOrId?: string; active?: boolean };
    walmart?: { tagOrId?: string; active?: boolean };
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string[] | string }> }
) {
  const resolvedParams = await params;
  const rawParts = Array.isArray(resolvedParams.slug) ? resolvedParams.slug : [resolvedParams.slug];
  const joinedSlug = rawParts.join('/');
  const rawSlug = decodeURIComponent(joinedSlug || '').trim().replace(/^\/go\//, '').replace(/\/$/, '');
  const flatSlug = rawSlug.replace(/\//g, '-');

  // 1. Fetch dynamic affiliate settings early
  let amazonTag = DEFAULT_SETTINGS.amazon_associates_tag || 'miregalo26-20';
  let awinId = '1436844';

  try {
    const [affSettings, siteSettings] = await Promise.all([
      db.getSetting<AffiliatePlatformSettings>('affiliate_platform_settings'),
      db.getSetting<any>('site'),
    ]);

    const configuredAmzTag =
      affSettings?.platforms?.amazon?.tagOrId ||
      siteSettings?.amazon_associates_tag ||
      DEFAULT_SETTINGS.amazon_associates_tag;

    if (configuredAmzTag) {
      amazonTag = configuredAmzTag;
    }

    if (affSettings?.platforms?.awin?.tagOrId) {
      awinId = affSettings.platforms.awin.tagOrId;
    } else if (siteSettings?.awin_affiliate_id) {
      awinId = siteSettings.awin_affiliate_id;
    }
  } catch {}

  // 2. Find product in DB by exact slug or variations
  let product: any =
    (await db.findOne('products', { slug: rawSlug, active: true })) ||
    (await db.findOne('products', { slug: flatSlug, active: true }));

  if (!product && rawSlug.startsWith('prod-')) {
    const stripped = rawSlug.replace(/^prod-/, '');
    product =
      (await db.findOne('products', { slug: stripped, active: true })) ||
      (await db.findOne('products', { id: `prod-${stripped}`, active: true }));
  }

  if (!product && !rawSlug.startsWith('prod-')) {
    product =
      (await db.findOne('products', { id: `prod-${rawSlug}`, active: true })) ||
      (await db.findOne('products', { id: `prod-${flatSlug}`, active: true }));
  }

  // 2.1 Dynamic fallback: Resolve product from post.items if not yet registered in products table
  if (!product) {
    const itemMatch = rawSlug.match(/^(.+)-item-(\d+)$/i);
    if (itemMatch) {
      const postSlug = itemMatch[1];
      const itemNum = parseInt(itemMatch[2], 10);
      const itemIdx = itemNum - 1;

      const post: any =
        (await db.findOne('posts', { slug: postSlug })) ||
        (await db.findOne('posts', { id: postSlug })) ||
        (await db.findOne('posts', { id: `post-${postSlug}` }));

      if (post && post.items && Array.isArray(post.items) && post.items[itemIdx]) {
        const item = post.items[itemIdx];
        const newProdId = `prod-${rawSlug}`;
        const prodName = item.heading || `${post.title} #${itemNum}`;
        const prodUrl =
          item.url && item.url.startsWith('http') && !item.url.includes('#')
            ? item.url
            : `https://www.amazon.es/s?k=${encodeURIComponent(prodName.slice(0, 70))}&tag=${amazonTag}`;

        const newProd = {
          id: newProdId,
          slug: rawSlug,
          name: prodName,
          url: prodUrl,
          merchant: item.merchant || 'Amazon España',
          image: item.image || 'https://media.miregalo.us/media/medium_necklace1_b337bcdf8b/medium_necklace1_b337bcdf8b.jpg',
          price: item.price || '29,99 €',
          currency: 'EUR',
          description: item.description_html || '<p>Producto recomendado para regalo.</p>',
          tags: ['regalos', 'destacado'],
          clicks: 0,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        try {
          product = await db.insert('products', newProd);
        } catch {
          product =
            (await db.findOne('products', { id: newProdId })) ||
            (await db.findOne('products', { slug: rawSlug }));
        }
      }
    }
  }

  let destUrl = product?.url;

  // 3. Check redirect rules if no product URL
  let redirectRule: any = null;
  if (!destUrl) {
    redirectRule =
      (await db.findOne('redirects', { source: `/go/${rawSlug}/`, active: true })) ||
      (await db.findOne('redirects', { source: `/go/${rawSlug}`, active: true })) ||
      (await db.findOne('redirects', { source: `/go/${flatSlug}/`, active: true })) ||
      (await db.findOne('redirects', { source: `/go/${flatSlug}`, active: true }));

    if (redirectRule) {
      destUrl = redirectRule.destination;
    }
  }

  // 4. Atomically increment click / hit counters with fallback update
  if (product) {
    try {
      await db.increment('products', product.id, 'clicks');
    } catch (err) {
      console.warn('[Go Router] Increment error, using fallback update:', err);
      try {
        const nextClicks = (product.clicks || 0) + 1;
        await db.update('products', product.id, { clicks: nextClicks });
      } catch {}
    }
  }
  if (redirectRule) {
    try {
      await db.increment('redirects', redirectRule.id, 'hits');
    } catch {}
  }

  // 5. Intelligent URL processing and affiliate link transformation
  if (destUrl) {
    // Unescape HTML entities (e.g. &amp; -> &)
    destUrl = destUrl.replace(/&amp;/g, '&').trim();

    const isDefunct =
      destUrl === '#' ||
      destUrl.includes('loveable.ai') ||
      destUrl.includes('loveable.us') ||
      !destUrl.startsWith('http');

    if (isDefunct) {
      // Convert defunct store links into targeted Amazon España search for the product
      const keyword = (product?.name || rawSlug.replace(/^(prod|item)-/i, '').replace(/[-_]+/g, ' ')).trim();
      destUrl = `https://www.amazon.es/s?k=${encodeURIComponent(keyword.slice(0, 70))}&tag=${amazonTag}`;
    } else {
      try {
        const u = new URL(destUrl);

        // Amazon URLs
        if (u.hostname.includes('amazon.') || u.hostname.includes('amzn.')) {
          const asinMatch = u.pathname.match(/(?:dp|gp\/product|exec\/obidos\/ASIN|o\/ASIN)\/([A-Z0-9]{10})/i);
          const asin = asinMatch ? asinMatch[1] : null;

          u.searchParams.set('tag', amazonTag);
          if (asin) {
            destUrl = `https://${u.hostname}/dp/${asin}/?tag=${amazonTag}`;
          } else {
            destUrl = u.toString();
          }
        }
        // Awin network URLs
        else if (u.hostname.includes('awin1.com')) {
          if (awinId) {
            u.searchParams.set('awinaffid', awinId);
          }
          destUrl = u.toString();
        }
        // Direct Etsy URLs -> wrap into Awin affiliate link
        else if (u.hostname.includes('etsy.com')) {
          destUrl = `https://www.awin1.com/cread.php?awinmid=10690&awinaffid=${awinId}&platform=cl&ued=${encodeURIComponent(destUrl)}`;
        }
      } catch {}
    }
  }

  // 6. Fallback if product or redirect is missing
  if (!destUrl) {
    const rawSearch = rawSlug
      .replace(/^(prod|item)-/i, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\b\d+\b/g, '')
      .trim();

    if (rawSearch && rawSearch.length > 2 && rawSearch.toLowerCase() !== 'amazon' && rawSearch.toLowerCase() !== 'regalo destacado') {
      destUrl = `https://www.amazon.es/s?k=${encodeURIComponent(rawSearch)}&tag=${amazonTag}`;
    } else {
      destUrl = `https://www.amazon.es/?tag=${amazonTag}`;
    }
  }

  // 7. Merchant affiliate parameter if defined on merchant record
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
