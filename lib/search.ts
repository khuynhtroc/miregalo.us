import 'server-only';
import { db } from '@/lib/db';
import { getCategories, sanitizeImageUrl } from '@/lib/repo';
import type { Post, Category } from '@/lib/types';

export interface SearchItemMatch {
  index: number;
  heading: string;
  snippet: string;
  image?: string;
}

export interface SearchResultPost {
  id: string;
  type: 'gift' | 'blog' | 'page';
  slug: string;
  title: string;
  excerpt: string;
  hero_image: string;
  hero_alt?: string;
  primary_category_id?: string | null;
  category_ids: string[];
  published_at?: string | null;
  matchedItems: SearchItemMatch[];
  score: number;
}

export interface SearchOptions {
  q: string;
  type?: 'all' | 'gift' | 'blog';
  topic?: string;
  page?: number;
  perPage?: number;
}

export interface SearchResponse {
  query: string;
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  rows: SearchResultPost[];
  counts: {
    all: number;
    gift: number;
    blog: number;
  };
  topics: {
    id: string;
    slug: string;
    name: string;
    count: number;
  }[];
}

const searchCache = globalThis as unknown as {
  __searchQueryCache?: Map<string, { at: number; val: SearchResponse }>;
};

/** Normalize string: lowercase, remove accents / diacritics */
export function normalizeText(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export async function searchPosts(options: SearchOptions): Promise<SearchResponse> {
  const query = (options.q || '').trim();
  const filterType = options.type || 'all';
  const filterTopic = options.topic || '';
  const perPage = options.perPage ?? 20;
  const page = Math.max(1, options.page ?? 1);

  if (!query) {
    return {
      query: '',
      total: 0,
      page: 1,
      perPage,
      totalPages: 0,
      rows: [],
      counts: { all: 0, gift: 0, blog: 0 },
      topics: [],
    };
  }

  const cacheKey = `${query.toLowerCase()}:${filterType}:${filterTopic}:${page}:${perPage}`;
  const now = Date.now();
  if (!searchCache.__searchQueryCache) searchCache.__searchQueryCache = new Map();
  const cached = searchCache.__searchQueryCache.get(cacheKey);
  if (cached && now - cached.at < 300_000) {
    return cached.val;
  }

  // Offload search filtering to PostgreSQL via Supabase to keep Worker CPU < 1ms
  const cleanTerm = query.replace(/[^\p{L}\p{N}\s-]/gu, ' ').trim();
  const firstWord = cleanTerm.split(/\s+/).filter((w) => w.length >= 2)[0] || cleanTerm;

  let dbRows: Post[] = [];
  let categories: Category[] = [];

  try {
    const [postsRes, cats] = await Promise.all([
      db.find('posts', {
        eq: { status: 'published' },
        search: {
          fields: ['title', 'excerpt', 'focus_keyword', 'slug'],
          term: firstWord,
        },
        select:
          'id,type,slug,title,excerpt,hero_image,hero_alt,primary_category_id,category_ids,published_at,focus_keyword',
        order: [{ field: 'published_at', asc: false }],
        limit: 120,
      }),
      getCategories(),
    ]);
    dbRows = postsRes.rows;
    categories = cats;
  } catch (e) {
    console.error('[search] searchPosts DB query failed:', (e as Error).message);
    categories = await getCategories();
  }

  const catById = new Map<string, Category>(categories.map((c) => [c.id, c]));
  const catBySlug = new Map<string, Category>(categories.map((c) => [c.slug, c]));

  const tokens = cleanTerm
    .split(/\s+/)
    .map((t) => normalizeText(t))
    .filter((t) => t.length > 1);
  if (tokens.length === 0) tokens.push(normalizeText(cleanTerm));

  let targetCatId: string | null = null;
  if (filterTopic) {
    if (catById.has(filterTopic)) targetCatId = filterTopic;
    else if (catBySlug.has(filterTopic)) targetCatId = catBySlug.get(filterTopic)!.id;
  }

  const matchedList: SearchResultPost[] = [];
  const typeCounts = { all: 0, gift: 0, blog: 0 };
  const topicCountsMap = new Map<string, number>();

  for (const post of dbRows) {
    if (post.type === 'page') continue;
    let score = 10;
    const normTitle = normalizeText(post.title);
    const normExcerpt = normalizeText(post.excerpt);

    for (const tok of tokens) {
      if (normTitle.includes(tok)) score += 100;
      if (normExcerpt.includes(tok)) score += 30;
    }

    typeCounts.all++;
    if (post.type === 'gift') typeCounts.gift++;
    if (post.type === 'blog') typeCounts.blog++;

    const cids =
      Array.isArray(post.category_ids) && post.category_ids.length > 0
        ? post.category_ids
        : post.primary_category_id
        ? [post.primary_category_id]
        : [];
    for (const cid of cids) {
      topicCountsMap.set(cid, (topicCountsMap.get(cid) || 0) + 1);
    }

    if (filterType !== 'all' && post.type !== filterType) continue;
    if (targetCatId && !cids.includes(targetCatId)) continue;

    matchedList.push({
      id: post.id,
      type: post.type,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      hero_image: sanitizeImageUrl(post.hero_image),
      hero_alt: post.hero_alt,
      primary_category_id: post.primary_category_id,
      category_ids: cids,
      published_at: post.published_at,
      matchedItems: [],
      score,
    });
  }

  matchedList.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.published_at || '').localeCompare(a.published_at || '');
  });

  const total = matchedList.length;
  const totalPages = Math.ceil(total / perPage);
  const offset = (page - 1) * perPage;
  const rows = matchedList.slice(offset, offset + perPage);

  const topics = Array.from(topicCountsMap.entries())
    .map(([cid, count]) => {
      const cat = catById.get(cid);
      return {
        id: cid,
        slug: cat?.slug || cid,
        name: cat?.name || cid,
        count,
      };
    })
    .sort((a, b) => b.count - a.count);

  const response: SearchResponse = {
    query,
    total,
    page,
    perPage,
    totalPages,
    rows,
    counts: typeCounts,
    topics,
  };

  if (searchCache.__searchQueryCache.size > 30) searchCache.__searchQueryCache.clear();
  searchCache.__searchQueryCache.set(cacheKey, { at: now, val: response });
  return response;
}
