import 'server-only';
import { cache } from 'react';
import { db } from '@/lib/db';
import type { Post, Category, Author, Product, Redirect, SiteSettings, PostType, CatalogUrl, Merchant, Keyword } from '@/lib/types';
import { DEFAULT_SETTINGS } from '@/lib/settings-defaults';
import { HUBS } from '@/lib/urls';

/* ───────────────────────── Settings ───────────────────────── */

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const stored = (await db.getSetting<Partial<SiteSettings>>('site')) ?? {};
  return { ...DEFAULT_SETTINGS, ...stored };
});

/* ───────────────────────── Categories ───────────────────────── */

export const getCategories = cache(async (): Promise<Category[]> => {
  const { rows } = await db.find('categories', { order: [{ field: 'sort_order' }, { field: 'name' }] });
  return rows;
});

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return (await getCategories()).find((c) => c.slug === slug) ?? null;
}

export async function getCategoryMap(): Promise<Map<string, Category>> {
  return new Map((await getCategories()).map((c) => [c.id, c]));
}

export async function getCategoriesByGroup(group: Category['group']): Promise<Category[]> {
  return (await getCategories()).filter((c) => c.group === group);
}

/** Article counts per category (published only). */
export const getCategoryCounts = cache(async (): Promise<Record<string, number>> => {
  const { rows } = await db.find('posts', { eq: { status: 'published' }, select: 'id,category_ids' });
  const counts: Record<string, number> = {};
  for (const p of rows) for (const id of p.category_ids ?? []) counts[id] = (counts[id] ?? 0) + 1;
  return counts;
});

/* ───────────────────────── Authors ───────────────────────── */

export const getAuthors = cache(async (): Promise<Author[]> => (await db.find('authors', { order: [{ field: 'name' }] })).rows);

export async function getAuthorBySlug(slug: string) {
  return (await getAuthors()).find((a) => a.slug === slug) ?? null;
}
export async function getAuthorById(id: string | null) {
  if (!id) return null;
  return (await getAuthors()).find((a) => a.id === id) ?? null;
}

/* ───────────────────────── Posts ───────────────────────── */

const CARD_FIELDS =
  'id,type,slug,title,excerpt,hero_image,hero_alt,primary_category_id,category_ids,author_id,status,featured,editor_pick,published_at,updated_at,created_at';

export interface PostListOpts {
  type?: PostType | PostType[];
  categoryId?: string;
  categoryIds?: string[];
  authorId?: string;
  featured?: boolean;
  editorPick?: boolean;
  q?: string;
  page?: number;
  perPage?: number;
  excludeId?: string;
  full?: boolean;
}

export async function listPublishedPosts(opts: PostListOpts = {}): Promise<{ rows: Post[]; total: number }> {
  const perPage = opts.perPage ?? 24;
  const page = Math.max(1, opts.page ?? 1);
  const eq: Record<string, string | boolean> = { status: 'published' };
  if (typeof opts.type === 'string') eq.type = opts.type;
  if (opts.authorId) eq.author_id = opts.authorId;
  if (opts.featured !== undefined) eq.featured = opts.featured;
  if (opts.editorPick !== undefined) eq.editor_pick = opts.editorPick;
  const res = await db.find('posts', {
    eq,
    in: Array.isArray(opts.type) ? { field: 'type', values: opts.type } : undefined,
    contains: opts.categoryId ? { field: 'category_ids', value: opts.categoryId } : undefined,
    overlaps: opts.categoryIds?.length ? { field: 'category_ids', values: opts.categoryIds } : undefined,
    search: opts.q ? { fields: ['title', 'excerpt', 'focus_keyword'], term: opts.q } : undefined,
    order: [{ field: 'published_at', asc: false }],
    limit: perPage + (opts.excludeId ? 1 : 0),
    offset: (page - 1) * perPage,
    select: opts.full ? '*' : CARD_FIELDS,
  });
  let rows = res.rows;
  if (opts.excludeId) rows = rows.filter((r) => r.id !== opts.excludeId).slice(0, perPage);
  return { rows, total: res.total };
}

export async function getPublishedPost(type: PostType | PostType[], slug: string): Promise<Post | null> {
  const types = Array.isArray(type) ? type : [type];
  for (const t of types) {
    const p = await db.findOne('posts', { type: t, slug, status: 'published' });
    if (p) return p;
  }
  return null;
}

/** All published post paths – used by sitemap / URL map. */
export async function getAllPublishedForSitemap() {
  const { rows } = await db.find('posts', {
    eq: { status: 'published' },
    select: 'id,type,slug,title,hero_image,robots,canonical_url,published_at,updated_at,category_ids,excerpt',
    order: [{ field: 'published_at', asc: false }],
  });
  return rows;
}

/** Resolve the set of category ids that a hub page aggregates. */
export async function hubFilter(hubSlug: string): Promise<{ type?: PostType; categoryIds?: string[] }> {
  const hub = HUBS[hubSlug];
  if (!hub) return {};
  if (hub.group === 'all-gifts') return { type: 'gift' };
  if (hub.group === 'all-blog') return { type: 'blog' };
  const cats = await getCategoriesByGroup(hub.group);
  return { categoryIds: cats.map((c) => c.id) };
}

/* ───────────────────────── Products / affiliate ───────────────────────── */

export async function getProductsByIds(ids: string[]): Promise<Map<string, Product>> {
  if (!ids.length) return new Map();
  const { rows } = await db.find('products', { in: { field: 'id', values: ids } });
  return new Map(rows.map((p) => [p.id, p]));
}

export async function getProductBySlug(slug: string) {
  return db.findOne('products', { slug });
}

/* ───────────────────────── Redirects ───────────────────────── */

const g = globalThis as unknown as { __redirectCache?: { at: number; map: Map<string, Redirect> } };

export async function getRedirectMap(): Promise<Map<string, Redirect>> {
  const now = Date.now();
  if (g.__redirectCache && now - g.__redirectCache.at < 60_000) return g.__redirectCache.map;
  const { rows } = await db.find('redirects', {
    eq: { active: true },
    select: 'source,destination,status_code,active',
  });
  const map = new Map(rows.map((r) => [normalizePath(r.source), r]));
  g.__redirectCache = { at: now, map };
  return map;
}
export function invalidateRedirectCache() {
  g.__redirectCache = undefined;
}

export function normalizePath(p: string): string {
  let s = p.trim();
  try {
    if (/^https?:\/\//i.test(s)) s = new URL(s).pathname;
  } catch {}
  if (!s.startsWith('/')) s = '/' + s;
  if (!s.endsWith('/') && !/\.[a-z0-9]{2,5}$/i.test(s)) s += '/';
  return s.toLowerCase();
}

/* ───────────────────────── Catalog URLs ───────────────────────── */

export const getCatalogUrls = cache(async (): Promise<CatalogUrl[]> => {
  const { rows } = await db.find('catalog_urls', { order: [{ field: 'id', asc: true }] });
  return rows;
});

export async function getCatalogUrlByPath(path: string): Promise<CatalogUrl | null> {
  const normalized = normalizePath(path);
  const all = await getCatalogUrls();
  return all.find((u) => normalizePath(u.url) === normalized) ?? null;
}

export async function getCatalogUrlById(id: string): Promise<CatalogUrl | null> {
  const all = await getCatalogUrls();
  return all.find((u) => u.id === id) ?? null;
}

export async function getKeywordsForUrl(targetUrlIdOrPath: string): Promise<Keyword[]> {
  const { rows } = await db.find('keywords', {});
  return rows.filter(
    (k) => k.target_url_id === targetUrlIdOrPath || normalizePath(k.target_path) === normalizePath(targetUrlIdOrPath)
  );
}

/* ───────────────────────── Merchants ───────────────────────── */

export const getMerchants = cache(async (): Promise<Merchant[]> => {
  const { rows } = await db.find('merchants', { order: [{ field: 'name', asc: true }] });
  return rows;
});

export async function getMerchantById(id: string): Promise<Merchant | null> {
  return (await getMerchants()).find((m) => m.id === id) ?? null;
}

export async function getMerchantBySlug(slug: string): Promise<Merchant | null> {
  return (await getMerchants()).find((m) => m.slug === slug) ?? null;
}
