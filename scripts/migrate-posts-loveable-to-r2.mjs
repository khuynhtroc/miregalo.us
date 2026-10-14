import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function cleanMediaUrl(url) {
  if (!url || typeof url !== 'string') return url;
  return url
    .replace(/^https?:\/\/storage\.googleapis\.com\/loveable\.appspot\.com\//gi, 'https://media.miregalo.us/media/')
    .replace(/^https?:\/\/loveable\.appspot\.com\//gi, 'https://media.miregalo.us/media/')
    .replace(/^https?:\/\/cdn\.loveable\.us\//gi, 'https://media.miregalo.us/media/');
}

function cleanHtml(html) {
  if (!html || typeof html !== 'string') return html;
  let cleaned = html;
  // 1. Remove srcset and sizes
  cleaned = cleaned.replace(/\s+srcset=["'][^"']*["']/gi, '');
  cleaned = cleaned.replace(/\s+sizes=["'][^"']*["']/gi, '');
  cleaned = cleaned.replace(/\s+tamaños=["'][^"']*["']/gi, '');

  // 2. Replace storage URLs
  cleaned = cleaned.replace(/https?:\/\/storage\.googleapis\.com\/loveable\.appspot\.com\//gi, 'https://media.miregalo.us/media/');
  cleaned = cleaned.replace(/https?:\/\/loveable\.appspot\.com\//gi, 'https://media.miregalo.us/media/');
  cleaned = cleaned.replace(/https?:\/\/cdn\.loveable\.us\//gi, 'https://media.miregalo.us/media/');

  // 3. Rewrite old links
  cleaned = cleaned.replace(/https?:\/\/blog\.loveable\.us\/blog\/([a-zA-Z0-9_-]+)\/?/gi, '/blog/regalos-$1/');
  cleaned = cleaned.replace(/https?:\/\/blog\.loveable\.us\/([a-zA-Z0-9_-]+)\/?/gi, '/blog/regalos-$1/');
  cleaned = cleaned.replace(/https?:\/\/blog-admin\.loveable\.ai[^\s"'<>]+/gi, '#');
  cleaned = cleaned.replace(/https?:\/\/loveable\.us\/[^\s"'<>]+/gi, '#');
  cleaned = cleaned.replace(/https?:\/\/loveable\.ai\/[^\s"'<>]+/gi, '#');

  return cleaned;
}

function cleanItems(items) {
  if (!Array.isArray(items)) return items;
  return items.map((it) => {
    let item = { ...it };
    if (item.image) {
      item.image = cleanMediaUrl(item.image);
    }
    if (item.merchant && item.merchant.toLowerCase().includes('loveable')) {
      item.merchant = 'Miregalo Store';
    }
    if (item.url && item.url.includes('loveable')) {
      item.url = '#';
    }
    return item;
  });
}

function cleanText(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/\bLoveable Blog\b/gi, 'Miregalo Blog')
    .replace(/\bLoveable Now\b/gi, 'Miregalo')
    .replace(/\bLoveable\b/gi, 'Miregalo');
}

async function run() {
  console.log('====================================================');
  console.log('🚀 MIGRATING ALL POSTS MEDIA & URLS TO MIREGALO R2');
  console.log('====================================================\n');

  // STEP 1: Update local data/db.json
  console.log('--- Step 1: Updating data/db.json ---');
  const dbPath = 'data/db.json';
  const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  let localPostsUpdated = 0;
  for (const post of dbData.posts || []) {
    let modified = false;

    // hero_image
    if (post.hero_image && post.hero_image.includes('loveable')) {
      post.hero_image = cleanMediaUrl(post.hero_image);
      modified = true;
    }
    // og_image
    if (post.og_image && post.og_image.includes('loveable')) {
      post.og_image = cleanMediaUrl(post.og_image);
      modified = true;
    }
    // content_html
    if (post.content_html && (post.content_html.includes('loveable') || post.content_html.includes('srcset'))) {
      const cleaned = cleanHtml(post.content_html);
      if (cleaned !== post.content_html) {
        post.content_html = cleaned;
        modified = true;
      }
    }
    // intro_html
    if (post.intro_html && (post.intro_html.includes('loveable') || post.intro_html.includes('srcset'))) {
      const cleaned = cleanHtml(post.intro_html);
      if (cleaned !== post.intro_html) {
        post.intro_html = cleaned;
        modified = true;
      }
    }
    // items
    if (Array.isArray(post.items) && JSON.stringify(post.items).includes('loveable')) {
      post.items = cleanItems(post.items);
      modified = true;
    }
    // meta_description / seo_description
    if (post.meta_description && post.meta_description.includes('Loveable')) {
      post.meta_description = cleanText(post.meta_description);
      modified = true;
    }
    if (post.seo_description && post.seo_description.includes('Loveable')) {
      post.seo_description = cleanText(post.seo_description);
      modified = true;
    }
    // hero_alt
    if (post.hero_alt && post.hero_alt.includes('Loveable')) {
      post.hero_alt = cleanText(post.hero_alt);
      modified = true;
    }

    if (modified) {
      localPostsUpdated++;
    }
  }

  // Also clean dbData.products in db.json!
  let localProductsUpdated = 0;
  for (const prod of dbData.products || []) {
    if (prod.image && prod.image.includes('loveable')) {
      prod.image = cleanMediaUrl(prod.image);
      localProductsUpdated++;
    }
  }

  console.log(`Writing changes to data/db.json (${localPostsUpdated} posts, ${localProductsUpdated} products modified)...`);
  fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');
  console.log('✅ data/db.json successfully updated!\n');

  // STEP 2: Update Supabase posts table
  console.log('--- Step 2: Fetching All Posts from Supabase ---');
  let allSupabasePosts = [];
  let from = 0;
  const pageSize = 500;

  while (true) {
    const { data, error } = await supabase
      .from('posts')
      .select('id, slug, hero_image, og_image, hero_alt, seo_description, intro_html, content_html, items')
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Fetch error:', error);
      break;
    }
    if (!data || data.length === 0) break;
    allSupabasePosts.push(...data);
    from += pageSize;
    if (data.length < pageSize) break;
  }

  console.log(`Loaded ${allSupabasePosts.length} posts from Supabase.`);

  const postsToUpdate = [];
  for (const p of allSupabasePosts) {
    let modified = false;
    const updates = {};

    if (p.hero_image && p.hero_image.includes('loveable')) {
      updates.hero_image = cleanMediaUrl(p.hero_image);
      modified = true;
    }
    if (p.og_image && p.og_image.includes('loveable')) {
      updates.og_image = cleanMediaUrl(p.og_image);
      modified = true;
    }
    if (p.content_html && (p.content_html.includes('loveable') || p.content_html.includes('srcset'))) {
      const cleaned = cleanHtml(p.content_html);
      if (cleaned !== p.content_html) {
        updates.content_html = cleaned;
        modified = true;
      }
    }
    if (p.intro_html && (p.intro_html.includes('loveable') || p.intro_html.includes('srcset'))) {
      const cleaned = cleanHtml(p.intro_html);
      if (cleaned !== p.intro_html) {
        updates.intro_html = cleaned;
        modified = true;
      }
    }
    if (Array.isArray(p.items) && JSON.stringify(p.items).includes('loveable')) {
      updates.items = cleanItems(p.items);
      modified = true;
    }
    if (p.seo_description && p.seo_description.includes('Loveable')) {
      updates.seo_description = cleanText(p.seo_description);
      modified = true;
    }
    if (p.hero_alt && p.hero_alt.includes('Loveable')) {
      updates.hero_alt = cleanText(p.hero_alt);
      modified = true;
    }

    if (modified) {
      postsToUpdate.push({ id: p.id, slug: p.slug, updates });
    }
  }

  console.log(`Found ${postsToUpdate.length} posts in Supabase that require updates.`);

  const BATCH_SIZE = 50;
  let supabaseUpdatedCount = 0;
  for (let i = 0; i < postsToUpdate.length; i += BATCH_SIZE) {
    const chunk = postsToUpdate.slice(i, i + BATCH_SIZE);
    await Promise.all(
      chunk.map(async (item) => {
        const { error } = await supabase
          .from('posts')
          .update(item.updates)
          .eq('id', item.id);
        if (error) {
          console.error(`Failed updating post ${item.slug}:`, error.message);
        } else {
          supabaseUpdatedCount++;
        }
      })
    );
    console.log(`Updated ${supabaseUpdatedCount} / ${postsToUpdate.length} posts in Supabase...`);
  }

  console.log(`✅ Successfully updated ${supabaseUpdatedCount} posts in Supabase!\n`);

  // STEP 3: Verify halloween post specifically
  console.log('--- Step 3: Verifying target halloween post ---');
  const { data: hPost } = await supabase
    .from('posts')
    .select('id, slug, hero_image')
    .eq('slug', 'regalos-halloween-party-names')
    .single();

  console.log('Live Target Post in Supabase:');
  console.log(`  Slug: ${hPost?.slug}`);
  console.log(`  Hero Image: ${hPost?.hero_image}`);

  console.log('\n====================================================');
  console.log('🎉 ALL POSTS SUCCESSFULLY MIGRATED TO CLOUDFLARE R2!');
  console.log('====================================================');
}

run().catch(console.error);
