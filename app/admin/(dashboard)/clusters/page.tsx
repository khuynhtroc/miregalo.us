import { db } from '@/lib/db';
import { ClusterViewer } from './ClusterViewer';

export default async function AdminClustersPage() {
  const { rows } = await db.find('keywords', {
    order: [{ field: 'cluster', asc: true }],
  });

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#171a35', margin: '0 0 6px' }}>
          Keyword Clusters &amp; Topic Modeling
        </h1>
        <p style={{ margin: 0, color: '#69707d', fontSize: '0.92rem' }}>
          Explore the 26 content clusters (Recipients &amp; Occasions) mapping 500 search queries to canonical URLs.
        </p>
      </div>

      <ClusterViewer keywords={rows} />
    </div>
  );
}
