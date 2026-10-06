import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getAffiliateSettings, saveAffiliateSettings } from '@/lib/affiliate/sync';
import { db } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const settings = await getAffiliateSettings();
  
  // Aggregate stats
  const postsRes = await db.find('posts', { limit: 5000 });
  let totalItems = 0;
  let itemsWithGo = 0;
  const merchantDistribution: Record<string, number> = {};

  for (const post of postsRes.rows) {
    if (post.items) {
      for (const item of post.items) {
        totalItems++;
        if (item.url?.startsWith('/go/')) itemsWithGo++;
        const m = item.merchant || 'Unknown';
        merchantDistribution[m] = (merchantDistribution[m] || 0) + 1;
      }
    }
  }

  const productsRes = await db.find('products', { limit: 5000 });
  const redirectsRes = await db.find('redirects', { limit: 10000 });
  const goRedirects = redirectsRes.rows.filter(r => r.source.startsWith('/go/'));

  return NextResponse.json({
    settings,
    stats: {
      totalPosts: postsRes.rows.length,
      totalItems,
      itemsWithGo,
      totalAffiliateProducts: productsRes.rows.length,
      totalGoRedirects: goRedirects.length,
      merchantDistribution,
    },
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updated = await saveAffiliateSettings(body);

    // Keep SiteSettings in sync
    try {
      const site = await db.getSetting<any>('site');
      if (site) {
        await db.setSetting('site', {
          ...site,
          amazon_associates_tag: updated.platforms?.amazon?.tagOrId ?? site.amazon_associates_tag,
          awin_affiliate_id: updated.platforms?.awin?.tagOrId ?? site.awin_affiliate_id,
          ebay_campaign_id: updated.platforms?.ebay?.tagOrId ?? site.ebay_campaign_id,
          walmart_partner_id: updated.platforms?.walmart?.tagOrId ?? site.walmart_partner_id,
          default_affiliate_strategy: updated.defaultStrategy ?? site.default_affiliate_strategy,
        });
      }
    } catch (e) {
      console.warn('Sync site settings error:', e);
    }

    return NextResponse.json({ success: true, settings: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid request';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
