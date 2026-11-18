/**
 * migrate-supabase.mjs
 * Migrate all data from local backup (data/db.json) + media cleanup + Miregalo settings to new Supabase project.
 * Run: node scripts/migrate-supabase.mjs
 */
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const NEW_URL = 'https://cewrrewgnziioyujlseg.supabase.co';
const NEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNld3JyZXdnbnppaW95dWpsc2VnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NTAwNzY4MCwiZXhwIjoyMTEwNTgzNjgwfQ.DglEXEs0KVe5HZLciCKzBS0lWc6rUA0iVRaUmMI7c_0';

const sb = createClient(NEW_URL, NEW_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: {
    fetch: (url, options = {}) => fetch(url, { ...options, signal: AbortSignal.timeout(20000) }),
  },
});
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');

console.log('\n🚀 Supabase Full Restore (data/db.json → NEW Project)\n');
console.log(`  Target: ${NEW_URL}\n`);

const data = JSON.parse(readFileSync(path.join(root, 'data', 'db.json'), 'utf8'));

// Load broken image reports for media URL cleanup
const brokenContentUrls = new Set();
const brokenReport1Path = path.join(root, 'scripts', 'broken-images-report.json');
if (existsSync(brokenReport1Path)) {
  const rep1 = JSON.parse(readFileSync(brokenReport1Path, 'utf8'));
  for (const b of rep1.brokenImages || []) {
    if (b.url) brokenContentUrls.add(b.url);
  }
}
const brokenReport2Path = path.join(root, 'scripts', 'broken-content-and-items.json');
if (existsSync(brokenReport2Path)) {
  const rep2 = JSON.parse(readFileSync(brokenReport2Path, 'utf8'));
  for (const b of rep2.brokenContentImages || []) {
    if (b.url) brokenContentUrls.add(b.url);
  }
}

const VALID_HALLOWEEN_HEROES = [
  'https://media.miregalo.us/media/blog/uploads/2023/03/31085446/Halloween-Sweatshirt-Vintage.jpg',
  'https://media.miregalo.us/media/blog/uploads/2023/03/31100637/Hocus-Halloween-Pocus-Blankets.jpg',
  'https://media.miregalo.us/media/blog/uploads/2023/04/18041529/Halloween-Flickering-Candles.jpg',
  'https://media.miregalo.us/media/blog/uploads/2023/04/27012513/Halloween-Sweatshirt-and-Hoodie.jpg',
  'https://media.miregalo.us/media/blog/uploads/2023/05/27080900/Halloween-Wedding-Welcome-Sign.jpg',
];
const AROMATHERAPY_REPLACEMENT = 'https://media.miregalo.us/media/blog/uploads/2023/09/29144413/Chill-Out-at-a-Spa-Together.jpg';

function cleanMediaUrl(url, idx = 0) {
  if (!url || typeof url !== 'string') return '';
  let u = url.trim();
  if (
    u === '#' ||
    u.includes('photo-1511253819057-1547ddb8fa53') ||
    u.includes('photo-1511707171634-5f897ff02560') ||
    brokenContentUrls.has(u)
  ) {
    return VALID_HALLOWEEN_HEROES[idx % VALID_HALLOWEEN_HEROES.length];
  }
  if (u.includes('blog-admin.loveable.ai')) {
    return AROMATHERAPY_REPLACEMENT;
  }
  return u
    .replace(/^https?:\/\/storage\.googleapis\.com\/loveable\.appspot\.com\//i, 'https://media.miregalo.us/media/')
    .replace(/^https?:\/\/loveable\.appspot\.com\//i, 'https://media.miregalo.us/media/')
    .replace(/^https?:\/\/cdn\.loveable\.us\//i, 'https://media.miregalo.us/media/');
}

function cleanHtmlMedia(html) {
  if (!html || typeof html !== 'string') return '';
  let h = html
    .replace(/\s+srcset=["'][^"']*["']/gi, '')
    .replace(/\s+sizes=["'][^"']*["']/gi, '')
    .replace(/\s+tamaños=["'][^"']*["']/gi, '')
    .replace(/https?:\/\/storage\.googleapis\.com\/loveable\.appspot\.com\//gi, 'https://media.miregalo.us/media/')
    .replace(/https?:\/\/loveable\.appspot\.com\//gi, 'https://media.miregalo.us/media/')
    .replace(/https?:\/\/cdn\.loveable\.us\//gi, 'https://media.miregalo.us/media/')
    .replace(/https?:\/\/blog\.loveable\.us\/blog\/([a-zA-Z0-9_-]+)\/?/gi, '/blog/regalos-$1/')
    .replace(/https?:\/\/blog\.loveable\.us\/([a-zA-Z0-9_-]+)\/?/gi, '/blog/regalos-$1/')
    .replace(/https?:\/\/blog-admin\.loveable\.ai[^\s"'<>]+/gi, '#')
    .replace(/https?:\/\/loveable\.us\/[^\s"'<>]+/gi, '#')
    .replace(/https?:\/\/loveable\.ai\/[^\s"'<>]+/gi, '#');

  for (const badUrl of brokenContentUrls) {
    if (!h.includes(badUrl)) continue;
    const escaped = badUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    h = h
      .replace(new RegExp(`<figure[^>]*>[\\s\\S]*?<img[^>]+src=["']${escaped}["'][^>]*>[\\s\\S]*?<\\/figure>`, 'gi'), '')
      .replace(new RegExp(`<p[^>]*>\\s*<img[^>]+src=["']${escaped}["'][^>]*>\\s*<\\/p>`, 'gi'), '')
      .replace(new RegExp(`<img[^>]+src=["']${escaped}["'][^>]*>`, 'gi'), '');
  }

  h = h
    .replace(/<figure[^>]*>\s*<img[^>]+src=["']#["'][^>]*>[\s\S]*?<\/figure>/gi, '')
    .replace(/<p[^>]*>\s*<img[^>]+src=["']#["'][^>]*>\s*<\/p>/gi, '')
    .replace(/<img[^>]+src=["']#["'][^>]*>/gi, '');

  return h.trim();
}

function pick(obj, keys) {
  const res = {};
  for (const k of keys) {
    if (obj[k] !== undefined) res[k] = obj[k];
  }
  return res;
}

async function upsertChunkWithRetry(table, chunk, onConflict, retries = 6) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const { error } = await sb.from(table).upsert(chunk, { onConflict });
      if (!error) return;
      if (attempt === retries) throw new Error(`${table}: ${error.message}`);
    } catch (err) {
      if (attempt === retries) throw err;
    }
    await new Promise((r) => setTimeout(r, attempt * 1500));
  }
}

async function upsert(table, rows, onConflict = 'id', batchSize = 300, concurrency = 4) {
  if (!rows?.length) {
    console.log(`⚪ ${table}: 0 rows`);
    return 0;
  }
  process.stdout.write(`⏳ Seeding ${table} (${rows.length} rows)...`);
  const chunks = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    chunks.push(rows.slice(i, i + batchSize));
  }
  let completed = 0;
  for (let i = 0; i < chunks.length; i += concurrency) {
    const group = chunks.slice(i, i + concurrency);
    await Promise.all(group.map((chunk) => upsertChunkWithRetry(table, chunk, onConflict)));
    completed += group.reduce((acc, c) => acc + c.length, 0);
    process.stdout.write(`\r⏳ Seeding ${table}: ${completed}/${rows.length}`);
  }
  console.log(`\r✅ ${table.padEnd(20)} ${rows.length} rows synced`);
  return rows.length;
}

const AUTHOR_COLS = ['id', 'slug', 'name', 'entity_type', 'job_title', 'bio_html', 'avatar', 'email', 'website', 'same_as', 'created_at', 'updated_at'];
const CATEGORY_COLS = ['id', 'slug', 'name', 'group', 'eyebrow', 'short_intro', 'description_html', 'hero_image', 'seo_title', 'seo_description', 'sort_order', 'show_in_nav', 'show_in_footer', 'quick_link', 'created_at', 'updated_at'];
const PRODUCT_COLS = ['id', 'slug', 'name', 'url', 'merchant', 'image', 'price', 'currency', 'description', 'tags', 'clicks', 'active', 'created_at', 'updated_at'];
const POST_COLS = ['id', 'type', 'slug', 'title', 'excerpt', 'intro_html', 'content_html', 'items', 'faqs', 'hero_image', 'hero_alt', 'primary_category_id', 'category_ids', 'author_id', 'status', 'featured', 'editor_pick', 'focus_keyword', 'seo_title', 'seo_description', 'canonical_url', 'robots', 'og_image', 'published_at', 'created_at', 'updated_at'];
const REDIRECT_COLS = ['id', 'source', 'destination', 'code', 'hits', 'active', 'created_at', 'updated_at'];
const KEYWORD_COLS = ['id', 'keyword', 'target_path', 'post_type', 'cluster', 'intent', 'volume', 'difficulty', 'priority', 'status', 'post_id', 'notes', 'created_at', 'updated_at'];
const JOB_COLS = ['id', 'keyword_id', 'stage', 'payload', 'result', 'error', 'created_at', 'updated_at'];
const LINK_COLS = ['id', 'source_post_id', 'target_post_id', 'anchor', 'status', 'created_at'];
const CATALOG_URL_COLS = ['id', 'url', 'page_title', 'url_type', 'parent_url', 'priority', 'status', 'notes', 'meta_description', 'h1', 'created_at', 'updated_at'];
const MERCHANT_COLS = ['id', 'name', 'slug', 'website_url', 'affiliate_network', 'affiliate_param', 'commission_rate', 'active', 'created_at', 'updated_at'];
const GSC_OPP_COLS = ['id', 'type', 'query', 'page', 'impressions', 'clicks', 'current_position', 'expected_ctr', 'actual_ctr', 'potential_clicks', 'action_recommended', 'status', 'created_at', 'updated_at'];
const MEDIA_COLS = ['id', 'name', 'original_name', 'url', 'storage_provider', 'size_bytes', 'mime_type', 'width', 'height', 'alt_text', 'remote_key', 'synced_to_cloud', 'used_in', 'created_at', 'updated_at'];
const STORAGE_COLS = ['id', 'provider', 'cloudflare', 'supabase', 'auto_sync', 'last_synced_at', 'created_at', 'updated_at'];
const ANALYTICS_COLS = ['id', 'period', 'total_sessions', 'total_users', 'total_pageviews', 'bounce_rate', 'avg_session_duration', 'ga4_measurement_id', 'gsc_property', 'last_updated', 'channels', 'top_landing_pages', 'device_split', 'geo_split', 'created_at', 'updated_at'];

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
const sanitizedCategories = (data.categories || []).map((c, idx) => pick({
  ...c,
  hero_image: cleanMediaUrl(c.hero_image, idx),
}, CATEGORY_COLS));

const sanitizedProducts = (data.products || []).map((p, idx) => {
  const row = {
    ...p,
    currency: p.currency === 'EUR' ? 'USD' : (p.currency || 'USD'),
    price: p.price || '',
    url: p.url || '',
    merchant: p.merchant || '',
    image: cleanMediaUrl(p.image, idx),
    description: p.description || '',
    tags: Array.isArray(p.tags) ? p.tags : [],
    clicks: typeof p.clicks === 'number' ? p.clicks : 0,
    active: p.active !== false,
  };
  return pick(row, PRODUCT_COLS);
});

const validAuthorIds = new Set(sanitizedAuthors.map(a => a.id));
const validCategoryIds = new Set(sanitizedCategories.map(c => c.id));
const postsMap = new Map();
let pIdx = 0;
for (const p of (data.posts || [])) {
  pIdx++;
  const author_id = validAuthorIds.has(p.author_id) ? p.author_id : defaultAuthorId;
  const primary_category_id = p.primary_category_id && validCategoryIds.has(p.primary_category_id) ? p.primary_category_id : null;
  const items = Array.isArray(p.items)
    ? p.items.map((it, i) => ({
        ...it,
        image: cleanMediaUrl(it.image || it.image_url, pIdx + i),
      }))
    : [];
  const row = {
    ...p,
    author_id,
    primary_category_id,
    excerpt: p.excerpt || '',
    intro_html: cleanHtmlMedia(p.intro_html || ''),
    content_html: cleanHtmlMedia(p.content_html || ''),
    items,
    faqs: Array.isArray(p.faqs) ? p.faqs : [],
    hero_image: cleanMediaUrl(p.hero_image, pIdx),
    hero_alt: p.hero_alt || '',
    category_ids: Array.isArray(p.category_ids) ? p.category_ids : [],
    featured: !!p.featured,
    editor_pick: !!p.editor_pick,
    focus_keyword: p.focus_keyword || '',
    seo_title: p.seo_title || '',
    seo_description: p.seo_description || '',
    canonical_url: p.canonical_url || '',
    robots: p.robots || 'index,follow',
    og_image: cleanMediaUrl(p.og_image, pIdx),
  };
  const key = `${row.type || 'gift'}:${row.slug}`;
  postsMap.set(key, pick(row, POST_COLS));
}
const sanitizedPosts = Array.from(postsMap.values());
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
const keywordIds = new Set(sanitizedKeywords.map(k => k.id));

const sanitizedJobs = (data.content_jobs || [])
  .filter(j => !j.keyword_id || keywordIds.has(j.keyword_id))
  .map(j => pick(j, JOB_COLS));

const sanitizedLinks = (data.internal_links || [])
  .filter(l => postIds.has(l.source_post_id) && postIds.has(l.target_post_id))
  .map(l => pick(l, LINK_COLS));

const redirectsMap = new Map();
for (const r of (data.redirects || [])) {
  if (!r.source) continue;
  redirectsMap.set(r.source, pick({
    ...r,
    code: r.code || 301,
    hits: typeof r.hits === 'number' ? r.hits : 0,
    active: r.active !== false,
  }, REDIRECT_COLS));
}
const sanitizedRedirects = Array.from(redirectsMap.values());

const sanitizedCatalogUrls = (data.catalog_urls || []).map(c => pick(c, CATALOG_URL_COLS));
const sanitizedMerchants = (data.merchants || []).map(m => pick(m, MERCHANT_COLS));
const sanitizedGscOpps = (data.gsc_opportunities || []).map(g => pick(g, GSC_OPP_COLS));
const sanitizedMedia = (data.media || []).map(m => pick(m, MEDIA_COLS));
const sanitizedStorage = (data.storage_settings || []).map(s => pick(s, STORAGE_COLS));
const sanitizedAnalytics = (data.analytics || []).map(a => pick(a, ANALYTICS_COLS));

const miregaloSettings = {
  site_name: 'Miregalo',
  site_tagline: 'Ideas de regalos significativas para cada persona, relación y ocasión.',
  site_description: 'Guías y sugerencias de regalos pensadas para sorprender a quien más quieres en cualquier momento especial.',
  organization_name: 'Miregalo',
  organization_url: 'https://www.miregalo.us',
  logo_url: '/images/miregalo-logo.png',
  logo_fullsize_url: '/images/miregalo-logo-fullsize.png',
  favicon_url: '/favicon.png',
  default_og_image: '/images/miregalo-logo-fullsize.png',
  locale: 'es',
  title_separator: '|',
  shop_url: '/regalos/',
  shop_label: 'Explorar Regalos',
  contact_url: '/contacto/',
  copyright: '© 2026 Miregalo. Todos los derechos reservados.',
  footer_tagline: 'Ideas desde el corazón, hechas para compartir.',
  footer_about: 'Miregalo es tu portal de referencia para encontrar regalos originales, personalizados y emotivos para cada ocasión especial.',
  hero_eyebrow: 'Ideas con significado, hechas personales',
  hero_title: 'Encuentra un regalo que recordarán siempre',
  hero_lead: 'Explora guías detalladas para cada persona, relación y ocasión, y transforma la idea perfecta en un recuerdo inolvidable.',
  search_placeholder: 'Buscar ideas de regalos, personas u ocasiones...',
  cta_eyebrow: 'Hazlo personal',
  cta_title: '¿Encontraste la idea perfecta?',
  cta_text: 'Convierte tu inspiración en un regalo personalizado creado especialmente para ellos.',
  affiliate_disclosure: 'Este artículo contiene recomendaciones editoriales independientes. Si compras a través de nuestros enlaces, podemos recibir una pequeña comisión sin coste adicional para ti. En calidad de Afiliado de Amazon, obtengo ingresos por las compras adscritas que cumplen los requisitos aplicables.',
  posts_per_page: 24,
  ga4_id: 'G-WRGWXTNWV3',
  gtm_id: 'GTM-NLLPRRXN',
  gsc_verification: '',
  gsc_property: '',
  bing_verification: '',
  pinterest_verification: 'aa17ebb2f5874bb384abd7511116e441',
  pinterest_tag_id: '',
  ahrefs_key: 'TxPIlr+hGAIJpqeul2OREw',
  head_scripts: '',
  body_scripts: '',
  robots_extra: '',
  noindex_site: false,
  google_search_cx: '',
  amazon_associates_tag: 'miregalo26-20',
  awin_affiliate_id: '128945',
  ebay_campaign_id: '5338901234',
  walmart_partner_id: 'wm-giftblog-987',
  default_affiliate_strategy: 'smart_distribution',
  adsense_enabled: true,
  adsense_client_id: 'ca-pub-2959580292222970',
  adsense_slot_in_article: '',
  adsense_slot_in_feed: '',
  adsense_slot_sidebar: '',
  adsense_slot_multiplex: '',
};

let total = 0;

// 1. Seed Settings, Authors, Categories, Merchants, Catalog URLs first
const settingsRows = [{ key: 'site', value: miregaloSettings, updated_at: new Date().toISOString() }];
if (data.settings && typeof data.settings === 'object') {
  for (const [k, v] of Object.entries(data.settings)) {
    if (k !== 'site' && k !== 'story_reports') {
      settingsRows.push({ key: k, value: v, updated_at: new Date().toISOString() });
    }
  }
}
total += await upsert('settings', settingsRows, 'key', 10, 1);
total += await upsert('authors', sanitizedAuthors, 'id', 100, 1);
total += await upsert('categories', sanitizedCategories, 'id', 100, 1);
total += await upsert('merchants', sanitizedMerchants, 'id', 100, 1);
total += await upsert('catalog_urls', sanitizedCatalogUrls, 'id', 200, 2);

// 2. Seed Posts (with cleaned media URLs)
total += await upsert('posts', sanitizedPosts, 'id', 10, 2);

// 3. Seed Products, Redirects, Keywords, Links, etc.
total += await upsert('products', sanitizedProducts, 'id', 500, 4);
total += await upsert('redirects', sanitizedRedirects, 'id', 500, 4);
total += await upsert('keywords', sanitizedKeywords, 'id', 200, 2);
total += await upsert('content_jobs', sanitizedJobs, 'id', 200, 2);
total += await upsert('internal_links', sanitizedLinks, 'id', 500, 4);
total += await upsert('gsc_opportunities', sanitizedGscOpps, 'id', 100, 1);
total += await upsert('media', sanitizedMedia, 'id', 100, 1);
total += await upsert('storage_settings', sanitizedStorage, 'id', 10, 1);
total += await upsert('analytics', sanitizedAnalytics, 'id', 10, 1);

console.log(`\n🎉 Hoàn tất! Đã đồng bộ tổng cộng ${total} bản ghi sang Supabase mới.`);
