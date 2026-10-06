import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getSettings } from '@/lib/repo';
import { getAffiliateSettings, saveAffiliateSettings } from '@/lib/affiliate/sync';
import type { SiteSettings } from '@/lib/types';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const payload = (await req.json()) as Partial<SiteSettings>;
    const current = await getSettings();
    const merged = { ...current, ...payload };

    await db.setSetting('site', merged);

    // Keep affiliate_platform_settings synchronized
    try {
      const currentAffiliate = await getAffiliateSettings();
      let affUpdated = false;
      if (merged.amazon_associates_tag && currentAffiliate.platforms?.amazon && currentAffiliate.platforms.amazon.tagOrId !== merged.amazon_associates_tag) {
        currentAffiliate.platforms.amazon.tagOrId = merged.amazon_associates_tag;
        affUpdated = true;
      }
      if (merged.awin_affiliate_id && currentAffiliate.platforms?.awin && currentAffiliate.platforms.awin.tagOrId !== merged.awin_affiliate_id) {
        currentAffiliate.platforms.awin.tagOrId = merged.awin_affiliate_id;
        affUpdated = true;
      }
      if (merged.ebay_campaign_id && currentAffiliate.platforms?.ebay && currentAffiliate.platforms.ebay.tagOrId !== merged.ebay_campaign_id) {
        currentAffiliate.platforms.ebay.tagOrId = merged.ebay_campaign_id;
        affUpdated = true;
      }
      if (merged.walmart_partner_id && currentAffiliate.platforms?.walmart && currentAffiliate.platforms.walmart.tagOrId !== merged.walmart_partner_id) {
        currentAffiliate.platforms.walmart.tagOrId = merged.walmart_partner_id;
        affUpdated = true;
      }
      if (merged.default_affiliate_strategy && (merged.default_affiliate_strategy === 'smart_distribution' || merged.default_affiliate_strategy === 'amazon_primary' || merged.default_affiliate_strategy === 'round_robin')) {
        currentAffiliate.defaultStrategy = merged.default_affiliate_strategy;
        affUpdated = true;
      }
      if (affUpdated) {
        await saveAffiliateSettings(currentAffiliate);
      }
    } catch (e) {
      console.warn('Affiliate sync error during settings save:', e);
    }

    try {
      revalidatePath('/', 'layout');
    } catch (e) {
      console.warn('revalidatePath warning:', e);
    }

    return NextResponse.json(merged);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
