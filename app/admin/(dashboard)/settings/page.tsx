import { getSettings } from '@/lib/repo';
import { getAffiliateSettings } from '@/lib/affiliate/sync';
import { db } from '@/lib/db';
import { SettingsManager } from './SettingsManager';

export const metadata = {
  title: 'Settings & Configurations | Admin',
};

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};

  // 1. Fetch core settings and merchants safely
  const [settings, affiliateSettings, merchantsRes] = await Promise.all([
    getSettings().catch(() => ({}) as any),
    getAffiliateSettings().catch(() => ({}) as any),
    db.find('merchants', { order: [{ field: 'name', asc: true }], limit: 100 }).catch(() => ({ rows: [] })),
  ]);

  // 2. Fetch lightweight projections for stats without fetching heavy post content (prevents statement_timeout)
  let totalPosts = 0;
  let totalItemsCount = 0;
  let itemsWithGoCount = 0;
  const merchantCounts: Record<string, number> = {};
  let sampleProducts: any[] = [];
  let totalAffiliateProducts = 0;
  let totalGoRedirects = 0;

  try {
    const [postsRes, productsRes, redirectsRes] = await Promise.all([
      db.find('posts', { select: 'id, items', limit: 1000 }).catch(() => ({ rows: [], total: 0 })),
      db.find('products', { select: 'id, title, merchant, price, url', limit: 100 }).catch(() => ({ rows: [], total: 0 })),
      db.find('redirects', { select: 'id, source', limit: 1000 }).catch(() => ({ rows: [], total: 0 })),
    ]);

    totalPosts = postsRes.total || postsRes.rows.length;
    for (const post of (postsRes.rows as any[])) {
      if (post?.items && Array.isArray(post.items)) {
        for (const item of post.items) {
          totalItemsCount++;
          if (item?.url?.startsWith('/go/')) itemsWithGoCount++;
          const m = item?.merchant || 'Amazon España';
          merchantCounts[m] = (merchantCounts[m] || 0) + 1;
        }
      }
    }

    sampleProducts = productsRes.rows.slice(0, 50);
    totalAffiliateProducts = productsRes.total || productsRes.rows.length;
    totalGoRedirects = (redirectsRes.rows as any[]).filter((r) => r?.source?.startsWith('/go/')).length;
  } catch (err) {
    console.warn('[AdminSettings] Non-critical error loading stats:', err);
  }

  const dbDriver = process.env.DB_DRIVER === 'local' ? 'Local JSON' : 'Supabase';

  return (
    <SettingsManager
      initialSettings={settings}
      initialAffiliateSettings={affiliateSettings}
      initialMerchants={merchantsRes.rows}
      initialStats={{
        totalPosts,
        totalItems: totalItemsCount,
        itemsWithGo: itemsWithGoCount,
        totalAffiliateProducts,
        totalGoRedirects,
        merchantDistribution: merchantCounts,
      }}
      sampleProducts={sampleProducts}
      initialTab={resolvedParams?.tab}
      dbDriver={dbDriver}
    />
  );
}
