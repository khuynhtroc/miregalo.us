import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const dbPath = path.join(root, 'data', 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const url = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

// Whitelist of valid columns in Supabase posts table
const POST_COLS = [
  'id',
  'type',
  'slug',
  'title',
  'excerpt',
  'intro_html',
  'content_html',
  'items',
  'faqs',
  'hero_image',
  'hero_alt',
  'primary_category_id',
  'category_ids',
  'author_id',
  'status',
  'featured',
  'editor_pick',
  'focus_keyword',
  'seo_title',
  'seo_description',
  'canonical_url',
  'robots',
  'og_image',
  'published_at',
  'created_at',
  'updated_at',
];

const CATEGORY_COLS = [
  'id',
  'slug',
  'name',
  'group',
  'eyebrow',
  'short_intro',
  'description_html',
  'hero_image',
  'seo_title',
  'seo_description',
  'sort_order',
  'show_in_nav',
  'show_in_footer',
  'quick_link',
  'created_at',
  'updated_at',
];

function pick(obj, cols) {
  const res = {};
  for (const c of cols) {
    if (obj[c] !== undefined) res[c] = obj[c];
  }
  return res;
}

async function run() {
  console.log('=== SYNCING ALL DATA FROM DB.JSON TO SUPABASE ===\n');

  // 1. Remove obsolete dummy Vietnamese posts
  console.log('1. Cleaning dummy non-Spanish posts from Supabase...');
  const dummySlugs = [
    'chinh-sach-bao-mat',
    'dieu-khoan-su-dung',
    'chinh-sach-cookie',
    'mien-tru-trach-nhiem',
    'lien-he',
    'top-10-truyen-tranh-webtoon-dinh-cao',
    'spoil-one-piece-chap-moi-nhat',
    'thong-bao-nang-cap-app-doctruyen',
    'sap-ra-mat-tuyen-tap-kiem-hiep',
  ];
  const { error: delErr } = await sb.from('posts').delete().in('slug', dummySlugs);
  if (delErr) {
    console.warn('Warning deleting dummy slugs:', delErr.message);
  } else {
    console.log('✓ Cleaned dummy non-Spanish records.');
  }

  // 2. Ensure categories are up to date
  console.log('\n2. Upserting 34 categories...');
  const catRows = (db.categories || []).map((c) => pick(c, CATEGORY_COLS));
  const { error: catErr } = await sb.from('categories').upsert(catRows, { onConflict: 'id' });
  if (catErr) {
    throw new Error('Categories upsert failed: ' + catErr.message);
  }
  console.log(`✓ Upserted ${catRows.length} categories.`);

  // 3. Prepare posts with complete NOT NULL sanitation
  console.log(`\n3. Preparing ${db.posts.length} posts from db.json...`);
  const validAuthors = new Set(['4fc3159d-3e02-4d51-8929-68c3818776b8', 'a91e5d32-949f-43e6-95b2-3e28406f0e4b']);
  const defaultAuthor = '4fc3159d-3e02-4d51-8929-68c3818776b8';

  const postsToUpsert = db.posts.map((p) => {
    // Fix single mom image if needed
    let hero = p.hero_image || '';
    if (p.slug === 'frases-for-dating-single-mama' || hero.includes('inspiring-quotes-for-dating-a-single-mom.jpg')) {
      hero = 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1200&auto=format&fit=crop&q=80';
      p.hero_image = hero;
    }

    const row = {
      ...p,
      author_id: validAuthors.has(p.author_id) ? p.author_id : defaultAuthor,
      excerpt: p.excerpt || '',
      intro_html: p.intro_html || '',
      content_html: p.content_html || '',
      items: Array.isArray(p.items) ? p.items : [],
      faqs: Array.isArray(p.faqs) ? p.faqs : [],
      hero_image: hero,
      hero_alt: p.hero_alt || p.title || '',
      primary_category_id: p.primary_category_id || null,
      category_ids: Array.isArray(p.category_ids) ? p.category_ids : [],
      featured: !!p.featured,
      editor_pick: !!p.editor_pick,
      focus_keyword: p.focus_keyword || '',
      seo_title: p.seo_title || p.title || '',
      seo_description: p.seo_description || p.excerpt || '',
      canonical_url: p.canonical_url || '',
      robots: p.robots || 'index,follow',
      og_image: p.og_image || hero || '',
      status: p.status || 'published',
      published_at: p.published_at || new Date().toISOString(),
      created_at: p.created_at || new Date().toISOString(),
      updated_at: p.updated_at || new Date().toISOString(),
    };
    return pick(row, POST_COLS);
  });

  // Also update local db.json
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 1), 'utf8');

  // 4. Upsert posts in batches
  const batchSize = 50;
  console.log(`Starting upsert in batches of ${batchSize}...`);
  let synced = 0;

  for (let i = 0; i < postsToUpsert.length; i += batchSize) {
    const chunk = postsToUpsert.slice(i, i + batchSize);
    const { error: pErr } = await sb.from('posts').upsert(chunk, { onConflict: 'id' });
    if (pErr) {
      console.error(`\n❌ Error at batch ${i}..${i + chunk.length}:`, pErr.message);
      throw pErr;
    }
    synced += chunk.length;
    process.stdout.write(`\r  Progress: ${synced}/${postsToUpsert.length} posts synced (${Math.round((synced / postsToUpsert.length) * 100)}%)`);
  }

  console.log('\n\n✓ All posts successfully synced to Supabase!');

  // 5. Verification
  const { count: finalCount } = await sb.from('posts').select('*', { count: 'exact', head: true });
  console.log(`\n=== FINAL SUPABASE STATUS ===`);
  console.log(`Total posts in Supabase: ${finalCount}`);
}

run().catch((err) => {
  console.error('\nSync failed:', err);
  process.exit(1);
});
