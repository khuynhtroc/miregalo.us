import { getAffiliateSettings } from '@/lib/affiliate/sync';
import { db } from '@/lib/db';
import { AffiliateManager } from './AffiliateManager';

export const metadata = {
  title: 'Affiliate Links & Networks Synchronization | Admin',
};

export default async function AffiliateLinksPage() {
  const settings = await getAffiliateSettings();

  const [postsRes, productsRes, merchantsRes, redirectsRes] = await Promise.all([
    db.find('posts', { limit: 5000 }),
    db.find('products', { limit: 100 }),
    db.find('merchants', { limit: 50 }),
    db.find('redirects', { limit: 5000 }),
  ]);

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
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#101828', margin: 0 }}>
          🔗 Affiliate Networks & Post Items Synchronizer
        </h1>
        <p style={{ color: '#475467', marginTop: '6px', fontSize: '0.95rem' }}>
          Configure affiliate platforms (Amazon, Awin, eBay, Walmart) and synchronize all products & items across all 1,680+ gift guides.
        </p>
      </div>

      <AffiliateManager
        initialSettings={settings}
        initialStats={{
          totalPosts: postsRes.rows.length,
          totalItems: totalItemsCount,
          itemsWithGo: itemsWithGoCount,
          totalAffiliateProducts: productsRes.rows.length,
          totalGoRedirects: goRedirects.length,
          merchantDistribution: merchantCounts,
        }}
        sampleProducts={productsRes.rows.slice(0, 50)}
      />
    </div>
  );
}
