import { db } from '@/lib/db';
import { MerchantManager } from './MerchantManager';

export default async function AdminMerchantsPage() {
  const { rows } = await db.find('merchants', {
    order: [{ field: 'name', asc: true }],
  });

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#171a35', margin: '0 0 6px' }}>
          Affiliate Merchants &amp; Networks
        </h1>
        <p style={{ margin: 0, color: '#69707d', fontSize: '0.92rem' }}>
          Manage merchant partners, affiliate networks (Amazon Associates, Awin), commission rates, and tracking parameters.
        </p>
      </div>

      <MerchantManager initialMerchants={rows} />
    </div>
  );
}
