import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import type { Product, Post, ProductContainingPost } from '@/lib/types';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || undefined;
  const merchant = searchParams.get('merchant') || undefined;
  const hasPost = searchParams.get('has_post') || searchParams.get('hasPost') || undefined; // 'yes' | 'no'
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));

  // 1. Build product-to-post relationship index
  const postsRes = await db.find('posts', { limit: 2000, select: 'id,title,slug,items' });
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

  // 2. Fetch products
  const eqFilter: Record<string, any> = {};
  if (merchant) eqFilter.merchant = merchant;

  const res = await db.find('products', {
    eq: Object.keys(eqFilter).length > 0 ? eqFilter : undefined,
    search: q ? { fields: ['name', 'slug', 'merchant', 'description'], term: q } : undefined,
    order: [{ field: 'clicks', asc: false }, { field: 'name' }],
    limit: 1000,
  });

  // 3. Enrich products with post association, impressions, CTR and traffic sources
  let enrichedProducts: Product[] = res.rows.map((p: Product) => {
    const containing = productPostMap.get(p.id) || productPostMap.get(p.slug) || [];
    const clicks = p.clicks || 0;
    const estimatedImpressions = Math.max(clicks * 22 + (containing.length * 35) + 85, 1);
    const ctr = Number(((clicks / estimatedImpressions) * 100).toFixed(2));

    // Traffic sources distribution
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
        google_organic: organic_google,
        direct,
        social,
        referral,
      },
    };
  });

  // Filter by post presence if requested
  if (hasPost === 'yes') {
    enrichedProducts = enrichedProducts.filter((p) => (p.containing_posts?.length || 0) > 0);
  } else if (hasPost === 'no') {
    enrichedProducts = enrichedProducts.filter((p) => (p.containing_posts?.length || 0) === 0);
  }

  const total = enrichedProducts.length;
  const paginated = enrichedProducts.slice(offset, offset + limit);

  // Compute platform aggregate counts
  const merchantCounts: Record<string, number> = {};
  for (const p of enrichedProducts) {
    merchantCounts[p.merchant] = (merchantCounts[p.merchant] || 0) + 1;
  }

  return NextResponse.json({
    rows: paginated,
    total,
    stats: {
      totalProducts: total,
      totalClicks: enrichedProducts.reduce((sum, p) => sum + (p.clicks || 0), 0),
      totalWithPosts: enrichedProducts.filter((p) => (p.containing_posts?.length || 0) > 0).length,
      merchantCounts,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = (await req.json()) as Partial<Product>;
    if (!body.name || !body.slug) {
      return NextResponse.json({ error: 'Name and Slug are required' }, { status: 400 });
    }

    const cleanSlug = body.slug.toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
    const targetUrl = body.url || 'https://www.amazon.es/?tag=miregalo26-20';

    const product = await db.insert('products', {
      id: `prod-${cleanSlug}`,
      slug: cleanSlug,
      name: body.name,
      url: targetUrl,
      merchant: body.merchant || 'Amazon España',
      merchant_id: body.merchant_id || 'mch-amazon-es',
      image: body.image || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80',
      price: body.price || '29,99 €',
      currency: body.currency || 'EUR',
      description: body.description || '',
      tags: body.tags || ['regalos'],
      clicks: 0,
      active: body.active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const redirectRule = {
      id: `red-prod-${cleanSlug}`,
      source: `/go/${cleanSlug}/`,
      destination: targetUrl,
      code: 302 as const,
      hits: 0,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const existingRed = await db.findOne('redirects', { id: `red-prod-${cleanSlug}` });
    if (existingRed) {
      await db.update('redirects', existingRed.id, redirectRule);
    } else {
      await db.insert('redirects', redirectRule);
    }

    return NextResponse.json(product, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
