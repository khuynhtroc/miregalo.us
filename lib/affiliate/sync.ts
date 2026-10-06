import { db } from '@/lib/db';
import type { Post, Product, Redirect } from '@/lib/types';
import type {
  AffiliateSettings,
  AffiliateSyncOptions,
  AffiliateSyncResult,
  AffiliatePlatformConfig,
} from './types';

const DEFAULT_SETTINGS: AffiliateSettings = {
  defaultStrategy: 'smart_distribution',
  platforms: {
    amazon: {
      id: 'amazon',
      name: 'Amazon España (Associates)',
      tagOrId: 'giftblog-21',
      domain: 'https://www.amazon.es',
      active: true,
      commissionRate: '3% - 12%',
      notes: 'Primary merchant for fast Prime 24h fulfillment in Spain and Europe.',
      targetWeight: 60,
    },
    awin: {
      id: 'awin',
      name: 'Awin Network (El Corte Inglés, Fnac, Etsy)',
      tagOrId: '128945',
      domain: 'https://www.awin1.com',
      active: true,
      commissionRate: '5% - 15%',
      notes: 'Leading European affiliate network for department stores and craft makers.',
      targetWeight: 15,
    },
    ebay: {
      id: 'ebay',
      name: 'eBay Partner Network (EPN)',
      tagOrId: '5338901234',
      domain: 'https://www.ebay.es',
      active: true,
      commissionRate: '4% - 8%',
      notes: 'Vintage, collectible, and rare gifts marketplace.',
      targetWeight: 15,
    },
    walmart: {
      id: 'walmart',
      name: 'Walmart Creator & Impact',
      tagOrId: 'wm-giftblog-987',
      domain: 'https://goto.walmart.com',
      active: true,
      commissionRate: '4% - 10%',
      notes: 'Global consumer retail and lifestyle brand partner.',
      targetWeight: 10,
    },
  },
};

export async function getAffiliateSettings(): Promise<AffiliateSettings> {
  const saved = await db.getSetting<AffiliateSettings>('affiliate_platform_settings');
  if (saved && saved.platforms) {
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      platforms: {
        ...DEFAULT_SETTINGS.platforms,
        ...saved.platforms,
      },
    };
  }
  return DEFAULT_SETTINGS;
}

export async function saveAffiliateSettings(settings: Partial<AffiliateSettings>): Promise<AffiliateSettings> {
  const current = await getAffiliateSettings();
  const updated: AffiliateSettings = {
    ...current,
    ...settings,
    platforms: {
      ...current.platforms,
      ...(settings.platforms || {}),
    },
  };
  await db.setSetting('affiliate_platform_settings', updated);
  return updated;
}

/**
 * Generate a destination affiliate tracking URL for a specific platform.
 */
function buildPlatformAffiliateUrl(
  platformId: 'amazon' | 'awin' | 'ebay' | 'walmart' | 'direct',
  config: AffiliatePlatformConfig,
  productSlug: string,
  productTitle: string
): { url: string; merchant: string; buttonLabel: string } {
  const encodedTitle = encodeURIComponent(productTitle.slice(0, 50));

  switch (platformId) {
    case 'amazon':
      return {
        url: `https://www.amazon.es/s?k=${encodedTitle}&tag=${config.tagOrId}`,
        merchant: 'Amazon España',
        buttonLabel: 'Ver en Amazon España',
      };
    case 'awin':
      return {
        url: `https://www.awin1.com/cread.php?awinmid=15678&awinaffid=${config.tagOrId}&ued=https%3A%2F%2Fwww.elcorteingles.es%2Fbuscar%2F%3Fterm%3D${encodedTitle}`,
        merchant: 'El Corte Inglés (Awin)',
        buttonLabel: 'Ver en El Corte Inglés',
      };
    case 'ebay':
      return {
        url: `https://www.ebay.es/sch/i.html?_nkw=${encodedTitle}&campid=${config.tagOrId}&customid=giftblog`,
        merchant: 'eBay Partner Network',
        buttonLabel: 'Ver en eBay',
      };
    case 'walmart':
      return {
        url: `https://goto.walmart.com/c/${config.tagOrId}/568844/9253?u=https%3A%2F%2Fwww.walmart.com%2Fsearch%3Fq%3D${encodedTitle}`,
        merchant: 'Walmart Impact',
        buttonLabel: 'Ver en Walmart',
      };
    default:
      return {
        url: `https://www.amazon.es/?tag=${config.tagOrId || 'giftblog-21'}`,
        merchant: 'Amazon España',
        buttonLabel: 'Comprar Producto',
      };
  }
}

/**
 * Bulk synchronizer: walks all posts and synchronizes all items to affiliate platforms and /go/ redirects.
 */
export async function syncPostItemsWithAffiliateNetworks(
  options: AffiliateSyncOptions = {}
): Promise<AffiliateSyncResult> {
  const startTime = Date.now();
  const settings = await getAffiliateSettings();

  // Apply temporary overrides if passed
  if (options.customAmazonTag && settings.platforms.amazon) {
    settings.platforms.amazon.tagOrId = options.customAmazonTag;
  }
  if (options.customAwinId && settings.platforms.awin) {
    settings.platforms.awin.tagOrId = options.customAwinId;
  }
  if (options.customEbayCampId && settings.platforms.ebay) {
    settings.platforms.ebay.tagOrId = options.customEbayCampId;
  }
  if (options.customWalmartId && settings.platforms.walmart) {
    settings.platforms.walmart.tagOrId = options.customWalmartId;
  }

  const postsRes = await db.find('posts', { limit: 5000 });
  const posts = postsRes.rows;

  const redirectsRes = await db.find('redirects', { limit: 10000 });
  const redirectMap = new Map<string, Redirect>();
  for (const r of redirectsRes.rows) {
    redirectMap.set(r.source, r);
  }

  const productsRes = await db.find('products', { limit: 10000 });
  const productMap = new Map<string, Product>();
  for (const p of productsRes.rows) {
    productMap.set(p.slug, p);
  }

  const strategy = options.strategy || settings.defaultStrategy || 'smart_distribution';

  const platformCounts = {
    amazon: 0,
    awin: 0,
    ebay: 0,
    walmart: 0,
    direct: 0,
  };

  let totalItemsSynced = 0;
  let redirectsCreatedOrUpdated = 0;
  const now = new Date().toISOString();

  // Distribution cycle for round-robin / smart distribution
  // e.g., 6 Amazon, 1 Awin, 1 eBay, 1 Walmart
  const distributionCycle: ('amazon' | 'awin' | 'ebay' | 'walmart')[] = [];
  if (strategy === 'amazon_only') {
    distributionCycle.push('amazon');
  } else if (strategy === 'awin_only') {
    distributionCycle.push('awin');
  } else if (strategy === 'ebay_only') {
    distributionCycle.push('ebay');
  } else if (strategy === 'walmart_only') {
    distributionCycle.push('walmart');
  } else {
    // Smart distribution weights (60% Amazon, 15% Awin, 15% eBay, 10% Walmart)
    for (let i = 0; i < 6; i++) distributionCycle.push('amazon');
    for (let i = 0; i < 2; i++) distributionCycle.push('awin');
    for (let i = 0; i < 2; i++) distributionCycle.push('ebay');
    distributionCycle.push('walmart');
  }

  let cycleIndex = 0;

  for (const post of posts) {
    if (!post.items || post.items.length === 0) continue;

    let postModified = false;

    post.items.forEach((item, itemIdx) => {
      totalItemsSynced++;
      const assignedPlatform = distributionCycle[cycleIndex % distributionCycle.length];
      cycleIndex++;

      platformCounts[assignedPlatform]++;

      const config = settings.platforms[assignedPlatform] || settings.platforms.amazon;
      const cleanSlug = (item.heading || `item-${itemIdx}`)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 45);

      const targetAff = buildPlatformAffiliateUrl(
        assignedPlatform,
        config,
        cleanSlug,
        item.heading || post.title
      );

      const goRedirectPath = `/go/${cleanSlug}/`;

      item.merchant = targetAff.merchant;
      item.button_label = targetAff.buttonLabel;
      item.url = goRedirectPath; // Outbound link through internal tracking router

      // Register or update in redirect table
      const existingRedirect = redirectMap.get(goRedirectPath);
      if (existingRedirect) {
        existingRedirect.destination = targetAff.url;
        existingRedirect.active = true;
        existingRedirect.updated_at = now;
      } else {
        const newRedirect: Redirect = {
          id: `red-aff-${cleanSlug}`,
          source: goRedirectPath,
          destination: targetAff.url,
          code: 301,
          hits: 0,
          active: true,
          created_at: now,
          updated_at: now,
        };
        redirectMap.set(goRedirectPath, newRedirect);
        redirectsCreatedOrUpdated++;
      }

      // Register or update in products table
      if (!productMap.has(cleanSlug)) {
        const newProd: Product = {
          id: `prod-${cleanSlug}`,
          slug: cleanSlug,
          name: item.heading,
          url: targetAff.url,
          merchant: targetAff.merchant,
          merchant_id: `mch-${assignedPlatform}`,
          image: item.image || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80',
          price: item.price || '29,99 €',
          currency: 'EUR',
          description: item.description_html || '<p>Producto recomendado para regalo.</p>',
          tags: [assignedPlatform, 'regalos', 'destacado'],
          clicks: 0,
          active: true,
          created_at: now,
          updated_at: now,
        };
        productMap.set(cleanSlug, newProd);
      }

      postModified = true;
    });

    if (postModified) {
      post.updated_at = now;
    }
  }

  // Persist back to DB
  if (db.upsertBatch) {
    await db.upsertBatch('posts', posts, ['id']);
    await db.upsertBatch('redirects', Array.from(redirectMap.values()), ['source']);
    await db.upsertBatch('products', Array.from(productMap.values()), ['slug']);
  }

  // Save settings with timestamp
  await saveAffiliateSettings({
    lastSyncedAt: now,
    lastSyncedItemsCount: totalItemsSynced,
  });

  return {
    success: true,
    totalPostsProcessed: posts.length,
    totalItemsSynced,
    platformCounts,
    redirectsCreatedOrUpdated,
    durationMs: Date.now() - startTime,
  };
}
