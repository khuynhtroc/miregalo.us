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
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const rawSlug = decodeURIComponent(slug || '').trim().replace(/^\/go\//, '').replace(/\/$/, '');

  // 1. Find product in DB by exact slug or variations
  let product = await db.findOne('products', { slug: rawSlug, active: true });

  if (!product && rawSlug.startsWith('prod-')) {
    product = await db.findOne('products', { slug: rawSlug.replace(/^prod-/, ''), active: true });
  }

  if (!product && !rawSlug.startsWith('prod-')) {
    product = await db.findOne('products', { id: `prod-${rawSlug}`, active: true });
  }

  let destUrl = product?.url;

  // 2. Check redirect rules if no product URL
  let redirectRule: any = null;
  if (!destUrl) {
    redirectRule =
      (await db.findOne('redirects', { source: `/go/${rawSlug}/`, active: true })) ||
      (await db.findOne('redirects', { source: `/go/${rawSlug}`, active: true }));

    if (redirectRule) {
      destUrl = redirectRule.destination;
    }
  }

  // 3. Atomically increment click / hit counters
  if (product) {
    try {
      await db.increment('products', product.id, 'clicks');
    } catch {}
  }
  if (redirectRule) {
    try {
      await db.increment('redirects', redirectRule.id, 'hits');
    } catch {}
  }

  // 4. Fetch dynamic affiliate settings
  let amazonEsTag = DEFAULT_SETTINGS.amazon_associates_tag || 'giftblog-21';
  let amazonUsTag = 'miregalo26-20';
  let awinId = '1436844';

  try {
    const [affSettings, siteSettings] = await Promise.all([
      db.getSetting<AffiliatePlatformSettings>('affiliate_platform_settings'),
      db.getSetting<any>('site'),
    ]);

    const configuredAmzTag = affSettings?.platforms?.amazon?.tagOrId || siteSettings?.amazon_associates_tag;
    if (configuredAmzTag) {
      if (configuredAmzTag.endsWith('-21')) {
        amazonEsTag = configuredAmzTag;
      } else if (configuredAmzTag.endsWith('-20')) {
        amazonUsTag = configuredAmzTag;
      } else {
        amazonEsTag = configuredAmzTag;
      }
    }

    if (affSettings?.platforms?.awin?.tagOrId) {
      awinId = affSettings.platforms.awin.tagOrId;
    } else if (siteSettings?.awin_affiliate_id) {
      awinId = siteSettings.awin_affiliate_id;
    }
  } catch {}

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
      destUrl = `https://www.amazon.es/s?k=${encodeURIComponent(keyword.slice(0, 70))}&tag=${amazonEsTag}`;
    } else {
      try {
        const u = new URL(destUrl);

        // Amazon URLs
        if (u.hostname.includes('amazon.') || u.hostname.includes('amzn.')) {
          const asinMatch = u.pathname.match(/(?:dp|gp\/product|exec\/obidos\/ASIN|o\/ASIN)\/([A-Z0-9]{10})/i);
          const asin = asinMatch ? asinMatch[1] : null;

          if (u.hostname.endsWith('.es')) {
            u.searchParams.set('tag', amazonEsTag);
            if (asin) {
              destUrl = `https://www.amazon.es/dp/${asin}/?tag=${amazonEsTag}`;
            } else {
              destUrl = u.toString();
            }
          } else if (u.hostname.endsWith('.com')) {
            // Amazon US: keep exact product on Amazon COM with valid US tag, or if ASIN exists
            u.searchParams.set('tag', amazonUsTag);
            if (asin) {
              destUrl = `https://www.amazon.com/dp/${asin}/?tag=${amazonUsTag}`;
            } else {
              destUrl = u.toString();
            }
          } else {
            // Other Amazon locales (.co.uk, .de, .fr)
            u.searchParams.set('tag', amazonEsTag);
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
      destUrl = `https://www.amazon.es/s?k=${encodeURIComponent(rawSearch)}&tag=${amazonEsTag}`;
    } else {
      destUrl = `https://www.amazon.es/?tag=${amazonEsTag}`;
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
