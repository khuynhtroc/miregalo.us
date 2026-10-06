import { db } from '@/lib/db';
import { DEFAULT_ANALYTICS } from '@/lib/analytics/data';
import { DashboardClient } from './DashboardClient';
import type { AnalyticsOverview } from '@/lib/types';

export default async function AdminDashboardOverview() {
  const [
    postsRes,
    productsRes,
    keywordsRes,
    catalogUrlsRes,
    merchantsRes,
    analyticsRes,
  ] = await Promise.all([
    db.find('posts', { limit: 1 }),
    db.find('products', { limit: 100 }),
    db.find('keywords', { limit: 1 }),
    db.find('catalog_urls', { limit: 1 }),
    db.find('merchants', { limit: 1 }),
    db.find('analytics', { limit: 1 }),
  ]);

  const totalPosts = postsRes.total;
  const publishedPosts = totalPosts; // 1,686 published
  const totalProducts = productsRes.total;
  const totalKeywords = keywordsRes.total;
  const totalCatalogUrls = catalogUrlsRes.total;
  const totalMerchants = merchantsRes.total;
  const totalClicks = productsRes.rows.reduce((sum, p) => sum + (p.clicks || 0), 0);

  const dbDriver = process.env.DB_DRIVER === 'supabase' ? 'Supabase' : 'Local JSON';

  const analyticsData: AnalyticsOverview =
    analyticsRes.rows && analyticsRes.rows.length > 0
      ? (analyticsRes.rows[0] as AnalyticsOverview)
      : DEFAULT_ANALYTICS;

  return (
    <DashboardClient
      initialAnalytics={analyticsData}
      systemStats={{
        totalCatalogUrls,
        totalKeywords,
        totalPosts,
        publishedPosts,
        totalMerchants,
        totalProducts,
        totalClicks,
        dbDriver,
      }}
    />
  );
}
