import { getCategories, getCategoryCounts } from '@/lib/repo';
import { CategoryManager } from './CategoryManager';

export default async function AdminCategoriesPage() {
  const [categories, counts] = await Promise.all([
    getCategories(),
    getCategoryCounts(),
  ]);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 4px', color: '#171a35' }}>
          Categories &amp; Taxonomies
        </h1>
        <p style={{ margin: 0, color: '#69707d', fontSize: '0.88rem' }}>
          Manage all 29 categories, hubs, landing copy, and menu visibility.
        </p>
      </div>

      <CategoryManager initialCategories={categories} counts={counts} />
    </div>
  );
}
