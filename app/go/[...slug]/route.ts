import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DEFAULT_SETTINGS } from '@/lib/settings-defaults';
import {
  amazonSearchUrl,
  toTargetMerchantUrl,
  resolveMarketplace,
  DEFAULT_AMAZON_TAG,
} from '@/lib/commerce';

interface AffiliatePlatformSettings {
  platforms?: Record<string, { tagOrId?: string; active?: boolean }>;
}

function renderAmazonAppBridgeHtml(destUrl: string, productName: string): string {
  let androidIntentUrl = destUrl;
  try {
    const u = new URL(destUrl);
    androidIntentUrl = `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=https;package=com.amazon.mShop.android.shopping;end;`;
  } catch {}

  const safeTitle = (productName || 'Producto en Amazon').replace(/"/g, '&quot;');

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
  <title>Abriendo en Amazon...</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; box-sizing: border-box; text-align: center; }
    .card { background: #ffffff; border-radius: 18px; padding: 32px 24px; max-width: 420px; width: 100%; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    .badge { display: inline-flex; align-items: center; gap: 6px; background: #fef3c7; color: #92400e; font-size: 13px; font-weight: 700; padding: 6px 12px; border-radius: 9999px; margin-bottom: 16px; }
    h1 { font-size: 20px; font-weight: 800; line-height: 1.35; margin: 0 0 12px; color: #1e293b; }
    p { font-size: 14px; color: #64748b; line-height: 1.5; margin: 0 0 24px; }
    .btn-app { display: block; background: #ff9900; background: linear-gradient(135deg, #ff9900, #f59e0b); color: #111827; font-size: 16px; font-weight: 800; padding: 16px 20px; border-radius: 12px; text-decoration: none; margin-bottom: 12px; box-shadow: 0 4px 14px rgba(245,158,11,0.35); }
    .btn-web { display: block; background: #f1f5f9; color: #475569; font-size: 14px; font-weight: 600; padding: 12px 18px; border-radius: 10px; text-decoration: none; }
    .tip { font-size: 12px; color: #94a3b8; margin-top: 20px; line-height: 1.4; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">🛒 Ventajas Prime Disponibles</div>
    <h1>${safeTitle}</h1>
    <p>Para ver el precio exacto, opiniones y envío rápido con tu cuenta, abre en la App de Amazon:</p>
    <a id="btn-app" class="btn-app" href="${destUrl}">Abrir en la App de Amazon ⚡</a>
    <a class="btn-web" href="${destUrl}">Continuar en el navegador web</a>
    <div class="tip">💡 Si la app no abre automáticamente, toca los <b>···</b> arriba a la derecha y pulsa <b>"Abrir en Chrome / Safari"</b>.</div>
  </div>
  <script>
    (function() {
      var isAndroid = /Android/i.test(navigator.userAgent);
      var intentUrl = "${androidIntentUrl}";
      var destUrl = "${destUrl}";
      var appBtn = document.getElementById('btn-app');

      if (isAndroid) {
        appBtn.href = intentUrl;
        setTimeout(function() { window.location.href = intentUrl; }, 150);
      } else {
        setTimeout(function() { window.location.href = destUrl; }, 150);
      }
    })();
  </script>
</body>
</html>`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string[] | string }> }
) {
  const resolvedParams = await params;
  const rawParts = Array.isArray(resolvedParams.slug) ? resolvedParams.slug : [resolvedParams.slug];
  const joinedSlug = rawParts.join('/');
  const rawSlug = decodeURIComponent(joinedSlug || '').trim().replace(/^\/go\//, '').replace(/\/$/, '');
  const flatSlug = rawSlug.replace(/\//g, '-');

  // 1. Detect visitor country for Geotargeting & OneLink
  const geoOverride =
    req.nextUrl.searchParams.get('geo') ||
    req.nextUrl.searchParams.get('country') ||
    req.headers.get('x-visitor-country');

  const countryHeader =
    geoOverride ||
    req.headers.get('cf-ipcountry') ||
    req.headers.get('x-country-code') ||
    req.headers.get('x-geo-country') ||
    '';

  let visitorCountry = (countryHeader || '').toUpperCase();
  if (!visitorCountry || visitorCountry === 'XX' || visitorCountry === 'T1') {
    const acceptLang = req.headers.get('accept-language') || '';
    if (/es-ES/i.test(acceptLang)) visitorCountry = 'ES';
    else if (/es-MX/i.test(acceptLang)) visitorCountry = 'MX';
    else if (/es-CO/i.test(acceptLang)) visitorCountry = 'CO';
    else if (/es-AR/i.test(acceptLang)) visitorCountry = 'AR';
    else visitorCountry = 'US';
  }

  const marketplace = resolveMarketplace(visitorCountry);

  // 2. Fetch dynamic affiliate settings early
  let amazonTag = DEFAULT_SETTINGS.amazon_associates_tag || DEFAULT_AMAZON_TAG;
  let awinId = '1436844';
  const amazonTagsByCountry: Record<string, string> = {
    US: amazonTag,
  };

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
      amazonTagsByCountry.US = configuredAmzTag;
    }

    // Geotargeting tags for major marketplaces
    if (affSettings?.platforms?.amazon_es?.tagOrId) {
      amazonTagsByCountry.ES = affSettings.platforms.amazon_es.tagOrId;
    } else if (siteSettings?.amazon_associates_tag_es) {
      amazonTagsByCountry.ES = siteSettings.amazon_associates_tag_es;
    } else {
      amazonTagsByCountry.ES = DEFAULT_SETTINGS.amazon_associates_tag_es || 'miregalo09-21';
    }

    if (affSettings?.platforms?.amazon_mx?.tagOrId) {
      amazonTagsByCountry.MX = affSettings.platforms.amazon_mx.tagOrId;
    } else if (siteSettings?.amazon_associates_tag_mx) {
      amazonTagsByCountry.MX = siteSettings.amazon_associates_tag_mx;
    } else {
      amazonTagsByCountry.MX = amazonTag;
    }

    if (affSettings?.platforms?.awin?.tagOrId) {
      awinId = affSettings.platforms.awin.tagOrId;
    } else if (siteSettings?.awin_affiliate_id) {
      awinId = siteSettings.awin_affiliate_id;
    }
  } catch {}

  const currentAmazonTag = amazonTagsByCountry[marketplace.countryCode] || amazonTag;

  // 3. Find product in DB by exact slug or variations
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

  // 3.1 Dynamic fallback: Resolve product from post.items if not yet registered in products table
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
            : amazonSearchUrl(prodName, currentAmazonTag, marketplace.domain);

        const newProd = {
          id: newProdId,
          slug: rawSlug,
          name: prodName,
          url: prodUrl,
          merchant: item.merchant || 'Amazon',
          image: item.image || 'https://media.miregalo.us/media/medium_necklace1_b337bcdf8b/medium_necklace1_b337bcdf8b.jpg',
          price: item.price || '',
          currency: marketplace.currency,
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

  // 4. Check redirect rules if no product URL
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

  // 5. Atomically increment click / hit counters with fallback update
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

  // 6. Intelligent URL processing, Geotargeting and affiliate link transformation
  if (destUrl) {
    destUrl = destUrl.replace(/&amp;/g, '&').trim();

    const isDefunct =
      destUrl === '#' ||
      destUrl.includes('loveable.ai') ||
      destUrl.includes('loveable.us') ||
      !destUrl.startsWith('http');

    if (isDefunct) {
      const keyword = (product?.name || rawSlug.replace(/^(prod|item)-/i, '').replace(/[-_]+/g, ' ')).trim();
      destUrl = amazonSearchUrl(keyword, currentAmazonTag, marketplace.domain);
    } else {
      try {
        const u = new URL(destUrl);
        const keyword = (product?.name || rawSlug.replace(/^(prod|item)-/i, '').replace(/[-_]+/g, ' ')).trim();
        const isSpainOnlyAwin = u.hostname.includes('awin1.com') && /elcorteingles|amazon\./i.test(u.searchParams.get('ued') || '');

        if (
          u.hostname.includes('amazon.') ||
          u.hostname.includes('amzn.') ||
          u.hostname.includes('elcorteingles.') ||
          u.hostname.endsWith('ebay.es') ||
          isSpainOnlyAwin
        ) {
          destUrl = toTargetMerchantUrl(destUrl, keyword, {
            countryCode: marketplace.countryCode,
            tag: currentAmazonTag,
            tagsByCountry: amazonTagsByCountry,
          });
        } else if (u.hostname.includes('awin1.com')) {
          if (awinId) {
            u.searchParams.set('awinaffid', awinId);
          }
          destUrl = u.toString();
        } else if (u.hostname.includes('etsy.com')) {
          destUrl = `https://www.awin1.com/cread.php?awinmid=10690&awinaffid=${awinId}&platform=cl&ued=${encodeURIComponent(destUrl)}`;
        }
      } catch {}
    }
  }

  // 7. Fallback if product or redirect is missing
  if (!destUrl) {
    const rawSearch = rawSlug
      .replace(/^(prod|item)-/i, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\b\d+\b/g, '')
      .trim();

    if (rawSearch && rawSearch.length > 2 && rawSearch.toLowerCase() !== 'amazon' && rawSearch.toLowerCase() !== 'regalo destacado') {
      destUrl = amazonSearchUrl(rawSearch, currentAmazonTag, marketplace.domain);
    } else {
      destUrl = `https://${marketplace.domain}/?tag=${currentAmazonTag}`;
    }
  }

  // 8. Merchant affiliate parameter if defined on merchant record
  if (product?.merchant_id) {
    try {
      const merchant = await db.findOne('merchants', { id: product.merchant_id });
      if (merchant && merchant.affiliate_param && !destUrl.includes(merchant.affiliate_param)) {
        const sep = destUrl.includes('?') ? '&' : '?';
        destUrl = `${destUrl}${sep}${merchant.affiliate_param}`;
      }
    } catch {}
  }

  // 9. Mobile In-App Browser optimization (Step 4: Bridge page to open native Amazon App)
  const ua = req.headers.get('user-agent') || '';
  const isInAppBrowser = /FBAN|FBAV|Instagram|TikTok|Pinterest|Twitter|ByteDance|LinkedIn|Snapchat/i.test(ua);
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  const isAmazon = /amazon\.[a-z.]+|amzn\.[a-z]+/i.test(destUrl);

  if (isInAppBrowser && isMobile && isAmazon) {
    return new NextResponse(renderAmazonAppBridgeHtml(destUrl, product?.name || 'Producto en Amazon'), {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store, no-cache, must-revalidate',
      },
    });
  }

  // Standard immediate redirect
  return NextResponse.redirect(destUrl, 302);
}
