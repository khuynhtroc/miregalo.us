import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('=== PHÂN LOẠI CHI TIẾT REDIRECTS ===');

  // Load all posts
  const allPosts = new Set();
  let pFrom = 0;
  while (true) {
    const { data: posts } = await sb.from('posts').select('slug').range(pFrom, pFrom + 999);
    if (!posts || !posts.length) break;
    posts.forEach(p => allPosts.add(p.slug.toLowerCase()));
    pFrom += 1000;
  }
  const { data: categories } = await sb.from('categories').select('slug');
  const allCats = new Set((categories || []).map(c => c.slug.toLowerCase()));

  // Catalog URLs
  const { data: cUrls } = await sb.from('catalog_urls').select('url');
  const allCatalogUrls = new Set((cUrls || []).map(u => u.url.toLowerCase().replace(/^\/|\/$/g, '')));

  let from = 0;
  let externalGo = 0;
  let internalRedirects = 0;
  let internalDead = 0;
  let internalValid = 0;
  const deadList = [];

  while (true) {
    const { data: batch } = await sb.from('redirects').select('source, destination, hits, code').range(from, from + 999);
    if (!batch || !batch.length) break;

    for (const r of batch) {
      if (r.destination.startsWith('http://') || r.destination.startsWith('https://')) {
        externalGo++;
      } else {
        internalRedirects++;
        const clean = r.destination.toLowerCase().replace(/^\/|\/$/g, '');
        if (allPosts.has(clean) || allCats.has(clean) || allCatalogUrls.has(clean) || clean === '' || clean === 'regalos' || clean === 'blog') {
          internalValid++;
        } else {
          internalDead++;
          if (deadList.length < 50) {
            deadList.push(r);
          }
        }
      }
    }
    from += 1000;
    if (batch.length < 1000) break;
  }

  console.log(`\nTổng số rules kiểm tra: ${externalGo + internalRedirects}`);
  console.log(`- Affiliate outbound links (bắt đầu bằng http/https): ${externalGo}`);
  console.log(`- Internal redirects (chuyển hướng nội bộ trang web): ${internalRedirects}`);
  console.log(`  + Internal VALID (trỏ đến bài viết/danh mục có thật): ${internalValid}`);
  console.log(`  + Internal DEAD (trỏ đến trang 404): ${internalDead}`);

  console.log(`\n50 Dead Internal Redirects mẫu:`);
  deadList.forEach((d, i) => {
    console.log(`  ${i + 1}. [${d.code}] ${d.source} -> ${d.destination} (hits: ${d.hits})`);
  });
}

main().catch(console.error);
