import { db } from '@/lib/db';
import { UrlCatalogManager } from './UrlCatalogManager';

export default async function AdminUrlsPage() {
  const { rows, total } = await db.find('catalog_urls', {
    order: [{ field: 'id', asc: true }],
  });

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#171a35', margin: '0 0 6px' }}>
          URL Architecture & Catalog (92 URLs)
        </h1>
        <p style={{ margin: 0, color: '#69707d', fontSize: '0.92rem' }}>
          Overview of the complete Spanish URL taxonomy: Root, Silo Hub, 20 Recipients, 60 Sub-attributes/problems/urgencies, 6 Occasions, and 4 Styles.
        </p>
      </div>

      <UrlCatalogManager initialUrls={rows} total={total} />
    </div>
  );
}
