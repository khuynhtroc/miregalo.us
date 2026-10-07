import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function cleanContentHtml(html) {
  if (!html) return html;

  let cleaned = html;

  // 1. Strip srcset attributes from all img tags
  // This completely eliminates any Google Storage / loveable.appspot.com responsive URLs
  // and ensures every browser strictly loads src (which is 100% hosted on media.miregalo.us)
  cleaned = cleaned.replace(/\s+srcset=["'][^"']*["']/gi, '');
  cleaned = cleaned.replace(/\s+sizes=["'][^"']*["']/gi, '');
  cleaned = cleaned.replace(/\s+tamaños=["'][^"']*["']/gi, '');

  // 2. Replace any remaining storage.googleapis.com/loveable.appspot.com
  cleaned = cleaned.replace(/https?:\/\/storage\.googleapis\.com\/loveable\.appspot\.com\//gi, 'https://media.miregalo.us/media/');

  // 3. Replace any admin URLs
  cleaned = cleaned.replace(/https?:\/\/blog-admin\.loveable\.ai[^\s"'<>]+/gi, '#');

  // 4. Rewrite old blog.loveable.us links to internal paths
  cleaned = cleaned.replace(/https?:\/\/blog\.loveable\.us\/blog\/([a-zA-Z0-9_-]+)\/?/gi, '/blog/regalos-$1/');
  cleaned = cleaned.replace(/https?:\/\/blog\.loveable\.us\/([a-zA-Z0-9_-]+)\/?/gi, '/blog/regalos-$1/');

  // 5. Replace any remaining loveable.us / loveable.ai product links in <a> tags
  cleaned = cleaned.replace(/https?:\/\/loveable\.us\/[^\s"'<>]+/gi, '#');
  cleaned = cleaned.replace(/https?:\/\/loveable\.ai\/[^\s"'<>]+/gi, '#');

  return cleaned;
}

function cleanItems(items) {
  if (!Array.isArray(items)) return items;
  let modified = false;
  const newItems = items.map(item => {
    let newItem = { ...item };
    if (newItem.merchant && newItem.merchant.toLowerCase().includes('loveable')) {
      newItem.merchant = 'Miregalo Store';
      modified = true;
    }
    if (newItem.url && newItem.url.includes('loveable')) {
      newItem.url = '#';
      modified = true;
    }
    return newItem;
  });
  return { items: newItems, modified };
}

async function run() {
  console.log('===============================================================');
  console.log('🚀 PURGING ALL LOVEABLE URLS & ENFORCING CLOUDFLARE R2 MEDIA');
  console.log('===============================================================\n');

  console.log('Fetching all posts from Supabase...');
  let allPosts = [];
  let from = 0;
  const pageSize = 500;

  while (true) {
    const { data, error } = await supabase
      .from('posts')
      .select('id, slug, hero_image, items, content_html')
      .range(from, from + pageSize - 1);

    if (error) {
      console.error('Fetch error:', error);
      break;
    }
    if (!data || data.length === 0) break;
    allPosts.push(...data);
    from += pageSize;
    if (data.length < pageSize) break;
  }

  console.log(`Loaded ${allPosts.length} posts.\n`);

  let updatedPostsCount = 0;
  let srcsetCleanedCount = 0;
  let itemsCleanedCount = 0;

  const BATCH_SIZE = 25;
  for (let i = 0; i < allPosts.length; i += BATCH_SIZE) {
    const batch = allPosts.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (post) => {
      let isModified = false;
      const updates = {};

      // 1. Content HTML
      if (post.content_html) {
        const cleanedHtml = cleanContentHtml(post.content_html);
        if (cleanedHtml !== post.content_html) {
          updates.content_html = cleanedHtml;
          isModified = true;
          srcsetCleanedCount++;
        }
      }

      // 2. Items
      if (Array.isArray(post.items)) {
        const { items: cleanedItems, modified } = cleanItems(post.items);
        if (modified) {
          updates.items = cleanedItems;
          isModified = true;
          itemsCleanedCount++;
        }
      }

      // 3. Update Supabase if modified
      if (isModified) {
        updates.updated_at = new Date().toISOString();
        const { error: updateErr } = await supabase
          .from('posts')
          .update(updates)
          .eq('id', post.id);

        if (updateErr) {
          console.error(`Failed to update post ${post.id}:`, updateErr.message);
        } else {
          updatedPostsCount++;
        }
      }
    }));

    if ((i + BATCH_SIZE) % 100 === 0 || i + BATCH_SIZE >= allPosts.length) {
      console.log(`Processed ${Math.min(i + BATCH_SIZE, allPosts.length)} / ${allPosts.length} posts (Updated: ${updatedPostsCount})...`);
    }
  }

  console.log('\n===============================================================');
  console.log(`✅ COMPLETE!`);
  console.log(`- Total posts updated: ${updatedPostsCount}`);
  console.log(`- Posts with content_html cleaned (srcset / loveable URLs removed): ${srcsetCleanedCount}`);
  console.log(`- Posts with items cleaned: ${itemsCleanedCount}`);
  console.log('===============================================================\n');
}

run();
