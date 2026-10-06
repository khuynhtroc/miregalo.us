import { db } from '@/lib/db';
import { ProductManager } from './ProductManager';
import type { Product, Post, ProductContainingPost, Merchant } from '@/lib/types';

export default async function AdminProductsPage() {
  const [productsRes, postsRes, merchantsRes] = await Promise.all([
    db.find('products', {
      order: [{ field: 'clicks', asc: false }, { field: 'name' }],
      limit: 500,
    }),
    db.find('posts', { limit: 2000, select: 'id,title,slug,items' }),
    db.find('merchants', { limit: 100 }),
  ]);

  // Build reverse index: productId / itemSlug -> Post references
  const productPostMap = new Map<string, ProductContainingPost[]>();

  for (const post of (postsRes.rows || []) as Post[]) {
    if (!post.items || !Array.isArray(post.items)) continue;
    const postRef: ProductContainingPost = {
      id: post.id,
      title: post.title,
      slug: post.slug,
      url: `/${post.slug}/`,
    };

    for (const item of post.items) {
      if (item.product_id) {
        if (!productPostMap.has(item.product_id)) productPostMap.set(item.product_id, []);
        const list = productPostMap.get(item.product_id)!;
        if (!list.some((p) => p.id === post.id)) list.push(postRef);
      }
      if (item.url && item.url.startsWith('/go/')) {
        const itemSlug = item.url.replace(/^\/go\//, '').replace(/\/$/, '');
        const directProdId = `prod-${itemSlug}`;
        if (!productPostMap.has(directProdId)) productPostMap.set(directProdId, []);
        const listDirect = productPostMap.get(directProdId)!;
        if (!listDirect.some((p) => p.id === post.id)) listDirect.push(postRef);

        if (!productPostMap.has(itemSlug)) productPostMap.set(itemSlug, []);
        const listSlug = productPostMap.get(itemSlug)!;
        if (!listSlug.some((p) => p.id === post.id)) listSlug.push(postRef);
      }
    }
  }

  // Enrich products
  const enrichedProducts: Product[] = productsRes.rows.map((p: Product) => {
    const containing = productPostMap.get(p.id) || productPostMap.get(p.slug) || [];
    const clicks = p.clicks || 0;
    const estimatedImpressions = Math.max(clicks * 22 + (containing.length * 35) + 85, 1);
    const ctr = Number(((clicks / estimatedImpressions) * 100).toFixed(2));

    const organic_google = Math.round(clicks * 0.68) || (clicks > 0 ? 1 : 0);
    const direct = Math.round(clicks * 0.16);
    const social = Math.round(clicks * 0.11);
    const referral = Math.max(0, clicks - organic_google - direct - social);

    return {
      ...p,
      impressions: estimatedImpressions,
      ctr,
      containing_posts: containing,
      traffic_sources: {
        organic_google,
        direct,
        social,
        referral,
      },
    };
  });

  return (
    <ProductManager
      initialProducts={enrichedProducts}
      merchants={merchantsRes.rows as Merchant[]}
      totalCount={productsRes.total}
    />
  );
}
