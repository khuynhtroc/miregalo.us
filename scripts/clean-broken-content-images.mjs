import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
const envFile = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf-8') : '';
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const report = JSON.parse(fs.readFileSync('scripts/broken-content-and-items.json', 'utf8'));

// Group broken URLs by postId
const postBrokenMap = new Map();
report.brokenContentImages.forEach((item) => {
  if (!postBrokenMap.has(item.postId)) {
    postBrokenMap.set(item.postId, new Set());
  }
  postBrokenMap.get(item.postId).add(item.url);
});

console.log(`Found ${postBrokenMap.size} posts with broken content images.`);

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function removeBrokenImageFromHtml(html, url) {
  if (!html) return html;
  const escaped = escapeRegex(url);

  // 1. Remove <figure ...><img ... src="url" ...> ... </figure>
  const figureRegex = new RegExp(
    '<figure[^>]*>[\\s\\S]*?<img[^>]*src=[\"\']' + escaped + '[\"\'][^>]*>[\\s\\S]*?<\\/figure>',
    'gi'
  );
  let cleaned = html.replace(figureRegex, '');

  // 2. Remove <p ...><img ... src="url" ...></p>
  const pRegex = new RegExp(
    '<p[^>]*>\\s*<img[^>]*src=[\"\']' + escaped + '[\"\'][^>]*>\\s*<\\/p>',
    'gi'
  );
  cleaned = cleaned.replace(pRegex, '');

  // 3. Remove standalone <img ... src="url" ...>
  const imgRegex = new RegExp('<img[^>]*src=[\"\']' + escaped + '[\"\'][^>]*>', 'gi');
  cleaned = cleaned.replace(imgRegex, '');

  return cleaned;
}

async function run() {
  let updatedCount = 0;
  let skippedCount = 0;

  const postIds = Array.from(postBrokenMap.keys());
  console.log(`Processing ${postIds.length} posts...`);

  // Process in chunks of 20
  for (let i = 0; i < postIds.length; i += 20) {
    const chunkIds = postIds.slice(i, i + 20);
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, slug, content_html')
      .in('id', chunkIds);

    if (error) {
      console.error('Error fetching posts chunk:', error);
      continue;
    }

    for (const post of posts) {
      const brokenUrls = postBrokenMap.get(post.id);
      if (!brokenUrls || !post.content_html) continue;

      let originalHtml = post.content_html;
      let newHtml = originalHtml;

      for (const url of brokenUrls) {
        newHtml = removeBrokenImageFromHtml(newHtml, url);
      }

      if (newHtml !== originalHtml) {
        const { error: updateErr } = await supabase
          .from('posts')
          .update({ content_html: newHtml })
          .eq('id', post.id);

        if (updateErr) {
          console.error(`Failed to update ${post.id}:`, updateErr.message);
        } else {
          updatedCount++;
          console.log(`[${updatedCount}/${postIds.length}] Cleaned ${brokenUrls.size} broken images in post: ${post.slug}`);
        }
      } else {
        skippedCount++;
      }
    }
  }

  console.log(`\n=== Done! Updated ${updatedCount} posts, skipped ${skippedCount} posts ===`);
}

run();
