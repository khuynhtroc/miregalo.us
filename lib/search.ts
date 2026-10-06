import 'server-only';
import { db } from '@/lib/db';
import { getCategories } from '@/lib/repo';
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
  topic?: string; // category slug or id
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

// In-memory cache for fast search across all 1,679 posts
let cachedPosts: Post[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes

async function getSearchablePosts(): Promise<Post[]> {
  const now = Date.now();
  if (cachedPosts && now - lastCacheTime < CACHE_TTL) {
    return cachedPosts;
  }

  // Load all published posts with items for deep searching
  const { rows } = await db.find('posts', {
    eq: { status: 'published' },
    select: 'id,type,slug,title,excerpt,content_html,intro_html,items,hero_image,hero_alt,primary_category_id,category_ids,published_at,focus_keyword',
    order: [{ field: 'published_at', asc: false }],
  });

  cachedPosts = rows as Post[];
  lastCacheTime = now;
  return cachedPosts;
}

/** Normalize string: lowercase, remove accents / diacritics */
export function normalizeText(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Check if text matches token with basic prefix/stemming */
function tokenMatches(normText: string, normToken: string): boolean {
  if (normText.includes(normToken)) return true;
  // If token is at least 5 letters, match stem
  if (normToken.length >= 5) {
    const stem = normToken.replace(/(?:os|as|es|o|a|e|s)$/, '');
    if (stem.length >= 4 && normText.includes(stem)) return true;
  }
  return false;
}

/** Create snippet around matching term */
function createSnippet(text: string, term: string, maxLen = 140): string {
  const clean = (text || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return '';

  const normClean = normalizeText(clean);
  const normTerm = normalizeText(term);
  const pos = normClean.indexOf(normTerm);

  if (pos === -1) {
    return clean.length > maxLen ? clean.slice(0, maxLen) + '...' : clean;
  }

  const start = Math.max(0, pos - 30);
  const end = Math.min(clean.length, pos + normTerm.length + 90);
  return (start > 0 ? '...' : '') + clean.slice(start, end).trim() + (end < clean.length ? '...' : '');
}

export async function searchPosts(options: SearchOptions): Promise<SearchResponse> {
  const query = (options.q || '').trim();
  const filterType = options.type || 'all';
  const filterTopic = options.topic || '';
  const perPage = options.perPage ?? 20;
  const page = Math.max(1, options.page ?? 1);

  const [posts, categories] = await Promise.all([
    getSearchablePosts(),
    getCategories(),
  ]);

  const catById = new Map<string, Category>(categories.map((c) => [c.id, c]));
  const catBySlug = new Map<string, Category>(categories.map((c) => [c.slug, c]));

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

  const tokens = query
    .split(/\s+/)
    .map((t) => normalizeText(t))
    .filter((t) => t.length > 1);

  if (tokens.length === 0) {
    tokens.push(normalizeText(query));
  }

  // Pre-filter topic category if specified
  let targetCatId: string | null = null;
  if (filterTopic) {
    if (catById.has(filterTopic)) targetCatId = filterTopic;
    else if (catBySlug.has(filterTopic)) targetCatId = catBySlug.get(filterTopic)!.id;
  }

  const matchedList: SearchResultPost[] = [];
  const typeCounts = { all: 0, gift: 0, blog: 0 };
  const topicCountsMap = new Map<string, number>();

  for (const post of posts) {
    let score = 0;
    const normTitle = normalizeText(post.title);
    const normExcerpt = normalizeText(post.excerpt);
    const normKeyword = normalizeText(post.focus_keyword || '');

    // Title score
    let titleMatches = 0;
    for (const tok of tokens) {
      if (tokenMatches(normTitle, tok)) titleMatches++;
    }
    if (titleMatches > 0) {
      score += 100 * (titleMatches / tokens.length);
      if (normTitle.includes(tokens.join(' '))) score += 50;
    }

    // Excerpt score
    let excerptMatches = 0;
    for (const tok of tokens) {
      if (tokenMatches(normExcerpt, tok)) excerptMatches++;
    }
    if (excerptMatches > 0) {
      score += 40 * (excerptMatches / tokens.length);
    }

    // Keyword score
    if (normKeyword) {
      for (const tok of tokens) {
        if (tokenMatches(normKeyword, tok)) score += 30;
      }
    }

    // Deep search in Items (Gift guides)
    const matchedItems: SearchItemMatch[] = [];
    if (Array.isArray(post.items) && post.items.length > 0) {
      for (let i = 0; i < post.items.length; i++) {
        const item = post.items[i];
        const itemDesc = item.description_html || (item as any).description || '';
        const normH = normalizeText(item.heading);
        const normD = normalizeText(itemDesc);

        let itemScore = 0;
        for (const tok of tokens) {
          if (tokenMatches(normH, tok)) itemScore += 25;
          else if (tokenMatches(normD, tok)) itemScore += 15;
        }

        if (itemScore > 0) {
          score += itemScore;
          matchedItems.push({
            index: i + 1,
            heading: item.heading,
            snippet: createSnippet(itemDesc || item.heading, tokens[0]),
            image: item.image,
          });
        }
      }
    }

    // Deep search in Blog Content
    if (post.type === 'blog' && post.content_html) {
      const normContent = normalizeText(post.content_html);
      let contentMatches = 0;
      for (const tok of tokens) {
        if (tokenMatches(normContent, tok)) contentMatches++;
      }
      if (contentMatches > 0) {
        score += 20 * (contentMatches / tokens.length);
      }
    }

    if (score > 0) {
      // Aggregate counts across all matching posts
      typeCounts.all++;
      if (post.type === 'gift') typeCounts.gift++;
      if (post.type === 'blog') typeCounts.blog++;

      // Count topics
      const cids = Array.isArray(post.category_ids) && post.category_ids.length > 0
        ? post.category_ids
        : (post.primary_category_id ? [post.primary_category_id] : []);
      for (const cid of cids) {
        topicCountsMap.set(cid, (topicCountsMap.get(cid) || 0) + 1);
      }

      // Check if post satisfies current filter
      if (filterType !== 'all' && post.type !== filterType) {
        continue;
      }
      if (targetCatId && !cids.includes(targetCatId)) {
        continue;
      }

      matchedList.push({
        id: post.id,
        type: post.type,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        hero_image: post.hero_image,
        hero_alt: post.hero_alt,
        primary_category_id: post.primary_category_id,
        category_ids: cids,
        published_at: post.published_at,
        matchedItems: matchedItems.slice(0, 4),
        score,
      });
    }
  }

  // Sort by relevance score descending, then by publication date
  matchedList.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.published_at || '').localeCompare(a.published_at || '');
  });

  const total = matchedList.length;
  const totalPages = Math.ceil(total / perPage);
  const offset = (page - 1) * perPage;
  const rows = matchedList.slice(offset, offset + perPage);

  // Format topic list with counts
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

  return {
    query,
    total,
    page,
    perPage,
    totalPages,
    rows,
    counts: typeCounts,
    topics,
  };
}
