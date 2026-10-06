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
  const [settings, affiliateSettings, merchantsRes, postsRes, productsRes, redirectsRes] =
    await Promise.all([
      getSettings(),
      getAffiliateSettings(),
      db.find('merchants', { order: [{ field: 'name', asc: true }], limit: 100 }),
      db.find('posts', { limit: 5000 }),
      db.find('products', { limit: 100 }),
      db.find('redirects', { limit: 5000 }),
    ]);

  const dbDriver = process.env.DB_DRIVER === 'local' ? 'Local JSON' : 'Supabase';

  let totalItemsCount = 0;
  let itemsWithGoCount = 0;
  const merchantCounts: Record<string, number> = {};

  for (const post of postsRes.rows) {
    if (post.items) {
      for (const item of post.items) {
        totalItemsCount++;
        if (item.url?.startsWith('/go/')) itemsWithGoCount++;
        const m = item.merchant || 'Amazon España';
        merchantCounts[m] = (merchantCounts[m] || 0) + 1;
      }
    }
  }

  const goRedirects = redirectsRes.rows.filter((r) => r.source.startsWith('/go/'));

  return (
    <SettingsManager
      initialSettings={settings}
      initialAffiliateSettings={affiliateSettings}
      initialMerchants={merchantsRes.rows}
      initialStats={{
        totalPosts: postsRes.rows.length,
        totalItems: totalItemsCount,
        itemsWithGo: itemsWithGoCount,
        totalAffiliateProducts: productsRes.rows.length,
        totalGoRedirects: goRedirects.length,
        merchantDistribution: merchantCounts,
      }}
      sampleProducts={productsRes.rows.slice(0, 50)}
      initialTab={resolvedParams?.tab}
      dbDriver={dbDriver}
    />
  );
}
