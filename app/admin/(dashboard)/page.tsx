import { db } from '@/lib/db';
import { DEFAULT_ANALYTICS } from '@/lib/analytics/data';
import { DashboardClient } from './DashboardClient';
import type { AnalyticsOverview, GscOpportunity, SiteSettings } from '@/lib/types';

export default async function AdminDashboardOverview() {
  const [
    postsRes,
    productsRes,
    keywordsRes,
    catalogUrlsRes,
    merchantsRes,
    analyticsRes,
    gscOppRes,
    siteSettings,
  ] = await Promise.all([
    db.find('posts', { limit: 1 }),
    db.find('products', { limit: 100 }),
    db.find('keywords', { limit: 1 }),
    db.find('catalog_urls', { limit: 1 }),
    db.find('merchants', { limit: 1 }),
    db.find('analytics', { limit: 1 }),
    db.find('gsc_opportunities', { limit: 5 }),
    db.getSetting<Partial<SiteSettings>>('site'),
  ]);

  const totalPosts = postsRes.total;
  const publishedPosts = totalPosts; // 1,686 published
  const totalProducts = productsRes.total;
  const totalKeywords = keywordsRes.total;
  const totalCatalogUrls = catalogUrlsRes.total;
  const totalMerchants = merchantsRes.total;
  const totalClicks = productsRes.rows.reduce((sum, p) => sum + (p.clicks || 0), 0);

  const dbDriver = process.env.DB_DRIVER === 'supabase' ? 'Supabase (PostgreSQL)' : 'Local JSON';

  const analyticsData: AnalyticsOverview =
    analyticsRes.rows && analyticsRes.rows.length > 0
      ? { ...(analyticsRes.rows[0] as AnalyticsOverview) }
      : { ...DEFAULT_ANALYTICS };

  if (siteSettings?.ga4_id) {
    analyticsData.ga4_measurement_id = siteSettings.ga4_id;
  }
  if (siteSettings?.gsc_property) {
    analyticsData.gsc_property = siteSettings.gsc_property;
  }

  return (
    <DashboardClient
      initialAnalytics={analyticsData}
      gscOpportunities={gscOppRes.rows as GscOpportunity[]}
      siteSettings={siteSettings ?? {}}
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
