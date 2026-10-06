// Pushes data/seed.json (or data/db.json with --from-local) into Supabase.
// Usage:  node scripts/seed-supabase.mjs [--from-local]
// Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local and the migration applied.
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');

// tiny .env loader
for (const f of ['.env.local', '.env']) {
  const p = path.join(root, f);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false } });
const file = process.argv.includes('--from-local') ? 'db.json' : 'seed.json';
const data = JSON.parse(readFileSync(path.join(root, 'data', file), 'utf8'));

async function upsert(table, rows, onConflict = 'id', batchSize = 200) {
  if (!rows?.length) return;
  console.log(`⏳ Seeding ${table} (${rows.length} rows)...`);
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    const { error } = await sb.from(table).upsert(chunk, { onConflict });
    if (error) {
      if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
        console.warn(`   ⚠️ Table "${table}" does not exist in Supabase schema cache yet. Skipping.`);
        return;
      }
      throw new Error(`${table} [${i}..${i + chunk.length}]: ${error.message}`);
    }
    process.stdout.write(`\r   Progress: ${Math.min(i + batchSize, rows.length)}/${rows.length}`);
  }
  console.log(`\n✓ ${table}: ${rows.length} rows synced successfully`);
}

// 1. Whitelist helper
function pick(obj, keys) {
  const res = {};
  for (const k of keys) {
    if (obj[k] !== undefined) res[k] = obj[k];
  }
  return res;
}

const AUTHOR_COLS = ['id', 'slug', 'name', 'entity_type', 'job_title', 'bio_html', 'avatar', 'email', 'website', 'same_as', 'created_at', 'updated_at'];
const CATEGORY_COLS = ['id', 'slug', 'name', 'group', 'eyebrow', 'short_intro', 'description_html', 'hero_image', 'seo_title', 'seo_description', 'sort_order', 'show_in_nav', 'show_in_footer', 'quick_link', 'created_at', 'updated_at'];
const PRODUCT_COLS = ['id', 'slug', 'name', 'url', 'merchant', 'image', 'price', 'currency', 'description', 'tags', 'clicks', 'active', 'created_at', 'updated_at'];
const POST_COLS = ['id', 'type', 'slug', 'title', 'excerpt', 'intro_html', 'content_html', 'items', 'faqs', 'hero_image', 'hero_alt', 'primary_category_id', 'category_ids', 'author_id', 'status', 'featured', 'editor_pick', 'focus_keyword', 'seo_title', 'seo_description', 'canonical_url', 'robots', 'og_image', 'published_at', 'created_at', 'updated_at'];
const REDIRECT_COLS = ['id', 'source', 'destination', 'code', 'hits', 'active', 'created_at', 'updated_at'];
const KEYWORD_COLS = ['id', 'keyword', 'target_path', 'post_type', 'cluster', 'intent', 'volume', 'difficulty', 'priority', 'status', 'post_id', 'notes', 'created_at', 'updated_at'];

// 2. Authors
const defaultAuthorId = data.authors?.[0]?.id || '4fc3159d-3e02-4d51-8929-68c3818776b8';
const authorIds = new Set(data.authors?.map(a => a.id) || []);
const rawAuthors = [...(data.authors || [])];
if (!authorIds.has('a91e5d32-949f-43e6-95b2-3e28406f0e4b')) {
  rawAuthors.push({
    ...rawAuthors[0],
    id: 'a91e5d32-949f-43e6-95b2-3e28406f0e4b',
    slug: 'equipo-editorial'
  });
}
const sanitizedAuthors = rawAuthors.map(a => pick(a, AUTHOR_COLS));

// 3. Categories
const sanitizedCategories = (data.categories || []).map(c => pick(c, CATEGORY_COLS));

// 4. Products
const sanitizedProducts = (data.products || []).map(p => {
  const row = {
    ...p,
    currency: p.currency || 'EUR',
    price: p.price || '',
    url: p.url || '',
    merchant: p.merchant || '',
    image: p.image || '',
    description: p.description || '',
    tags: Array.isArray(p.tags) ? p.tags : [],
    clicks: typeof p.clicks === 'number' ? p.clicks : 0,
    active: p.active !== false,
  };
  return pick(row, PRODUCT_COLS);
});

// 5. Posts (Deduplicate by type:slug)
const validAuthorIds = new Set(sanitizedAuthors.map(a => a.id));
const postsMap = new Map();
for (const p of (data.posts || [])) {
  const author_id = validAuthorIds.has(p.author_id) ? p.author_id : defaultAuthorId;
  const row = {
    ...p,
    author_id,
    excerpt: p.excerpt || '',
    intro_html: p.intro_html || '',
    content_html: p.content_html || '',
    items: Array.isArray(p.items) ? p.items : [],
    faqs: Array.isArray(p.faqs) ? p.faqs : [],
    hero_image: p.hero_image || '',
    hero_alt: p.hero_alt || '',
    category_ids: Array.isArray(p.category_ids) ? p.category_ids : [],
    featured: !!p.featured,
    editor_pick: !!p.editor_pick,
    focus_keyword: p.focus_keyword || '',
    seo_title: p.seo_title || '',
    seo_description: p.seo_description || '',
    canonical_url: p.canonical_url || '',
    robots: p.robots || 'index,follow',
    og_image: p.og_image || '',
  };
  const key = `${row.type || 'gift'}:${row.slug}`;
  postsMap.set(key, pick(row, POST_COLS));
}
const sanitizedPosts = Array.from(postsMap.values());

// 6. Keywords
const postIds = new Set(sanitizedPosts.map(p => p.id));
const sanitizedKeywords = (data.keywords || []).map(k => {
  const post_id = k.post_id && postIds.has(k.post_id) ? k.post_id : null;
  const row = {
    ...k,
    post_id,
    target_path: k.target_path || '',
    cluster: k.cluster || '',
    intent: k.intent || '',
    volume: typeof k.volume === 'number' ? k.volume : 0,
    difficulty: typeof k.difficulty === 'number' ? k.difficulty : 0,
    priority: typeof k.priority === 'number' ? k.priority : 0,
    status: k.status || 'planned',
    notes: k.notes || '',
  };
  return pick(row, KEYWORD_COLS);
});

// 7. Redirects
const sanitizedRedirects = (data.redirects || []).map(r => {
  const row = {
    ...r,
    code: r.code || 301,
    hits: typeof r.hits === 'number' ? r.hits : 0,
    active: r.active !== false,
  };
  return pick(row, REDIRECT_COLS);
});

// 8. Admin & Catalog tables
const CATALOG_URL_COLS = ['id', 'url', 'page_title', 'url_type', 'parent_url', 'priority', 'status', 'notes', 'meta_description', 'h1', 'created_at', 'updated_at'];
const MERCHANT_COLS = ['id', 'name', 'slug', 'website_url', 'affiliate_network', 'affiliate_param', 'commission_rate', 'active', 'created_at', 'updated_at'];
const GSC_OPP_COLS = ['id', 'type', 'query', 'page', 'impressions', 'clicks', 'current_position', 'expected_ctr', 'actual_ctr', 'potential_clicks', 'action_recommended', 'status', 'created_at', 'updated_at'];
const MEDIA_COLS = ['id', 'name', 'original_name', 'url', 'storage_provider', 'size_bytes', 'mime_type', 'width', 'height', 'alt_text', 'remote_key', 'synced_to_cloud', 'used_in', 'created_at', 'updated_at'];
const STORAGE_COLS = ['id', 'provider', 'cloudflare', 'supabase', 'auto_sync', 'last_synced_at', 'created_at', 'updated_at'];
const ANALYTICS_COLS = ['id', 'period', 'total_sessions', 'total_users', 'total_pageviews', 'bounce_rate', 'avg_session_duration', 'ga4_measurement_id', 'gsc_property', 'last_updated', 'channels', 'top_landing_pages', 'device_split', 'geo_split', 'created_at', 'updated_at'];

const sanitizedCatalogUrls = (data.catalog_urls || []).map(c => pick(c, CATALOG_URL_COLS));
const sanitizedMerchants = (data.merchants || []).map(m => pick(m, MERCHANT_COLS));
const sanitizedGscOpps = (data.gsc_opportunities || []).map(g => pick(g, GSC_OPP_COLS));
const sanitizedMedia = (data.media || []).map(m => pick(m, MEDIA_COLS));
const sanitizedStorage = (data.storage_settings || []).map(s => pick(s, STORAGE_COLS));
const sanitizedAnalytics = (data.analytics || []).map(a => pick(a, ANALYTICS_COLS));

// Execute in foreign-key dependency order
await upsert('authors', sanitizedAuthors, 'id', 100);
await upsert('categories', sanitizedCategories, 'id', 100);
await upsert('products', sanitizedProducts, 'id', 300);
await upsert('posts', sanitizedPosts, 'id', 50);
await upsert('redirects', sanitizedRedirects, 'id', 500);
await upsert('keywords', sanitizedKeywords, 'id', 200);
await upsert('catalog_urls', sanitizedCatalogUrls, 'id', 200);
await upsert('merchants', sanitizedMerchants, 'id', 100);
await upsert('gsc_opportunities', sanitizedGscOpps, 'id', 100);
await upsert('media', sanitizedMedia, 'id', 100);
await upsert('storage_settings', sanitizedStorage, 'id', 10);
await upsert('analytics', sanitizedAnalytics, 'id', 10);

for (const [k, v] of Object.entries(data.settings ?? {})) {
  const { error } = await sb.from('settings').upsert({ key: k, value: v }, { onConflict: 'key' });
  if (error) throw new Error(`settings: ${error.message}`);
}
console.log(`Done – seeded Supabase from data/${file}`);
