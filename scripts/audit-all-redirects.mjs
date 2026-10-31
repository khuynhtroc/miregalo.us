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
  console.log('=== QUÉT TOÀN BỘ 31.723 REDIRECTS ĐỐI SOÁT VỚI URL THẬT ===');

  // 1. Lấy toàn bộ posts
  const allPosts = [];
  let offset = 0;
  while (true) {
    const { data } = await sb.from('posts').select('slug, type, status').range(offset, offset + 999);
    if (!data || data.length === 0) break;
    allPosts.push(...data);
    offset += data.length;
    if (data.length < 1000) break;
  }
  const postSlugs = new Set(allPosts.map(p => p.slug));
  const blogSlugs = new Set(allPosts.filter(p => p.type === 'blog').map(p => p.slug));
  const giftSlugs = new Set(allPosts.filter(p => p.type !== 'blog').map(p => p.slug));

  // 2. Lấy categories
  const { data: categories } = await sb.from('categories').select('slug');
  const catSlugs = new Set(categories?.map(c => c.slug) || []);

  // 3. Lấy catalog URLs
  const { data: catalogUrls } = await sb.from('catalog_urls').select('url');
  const catalogPaths = new Set(catalogUrls?.map(c => c.url.replace(/\/$/, '').replace(/^\//, '')) || []);

  console.log(`Posts: ${allPosts.length}, Categories: ${catSlugs.size}, Catalog URLs: ${catalogPaths.size}`);

  // 4. Quét toàn bộ redirects theo lô 2000
  let totalRedirects = 0;
  let brokenRedirectsCount = 0;
  const brokenMap = new Map(); // destination -> count

  offset = 0;
  while (true) {
    const { data: batch, error } = await sb
      .from('redirects')
      .select('source, destination, active')
      .range(offset, offset + 999);
    
    if (error || !batch || batch.length === 0) break;
    totalRedirects += batch.length;
    offset += batch.length;

    for (const r of batch) {
      if (!r.active) continue;
      const dest = r.destination ? r.destination.trim() : '';
      const clean = dest.replace(/^\/+/, '').replace(/\/+$/, '');

      if (clean === '') continue; // Home
      if (catSlugs.has(clean) || catalogPaths.has(clean)) continue;
      if (dest.startsWith('/blog/')) {
        const bSlug = clean.replace(/^blog\//, '');
        if (blogSlugs.has(bSlug) || postSlugs.has(bSlug)) continue;
      }
      if (giftSlugs.has(clean) || postSlugs.has(clean)) continue;

      // Không tìm thấy
      brokenRedirectsCount++;
      brokenMap.set(dest, (brokenMap.get(dest) || 0) + 1);
    }

    if (offset % 5000 === 0) {
      console.log(`... Đã quét ${totalRedirects} redirects...`);
    }
    if (batch.length < 1000) break;
  }

  console.log(`\n================================================================`);
  console.log('KẾT QUẢ QUÉT 31.723 REDIRECTS:');
  console.log(`- Tổng số redirects: ${totalRedirects}`);
  console.log(`- Số redirect trỏ vào đích BỊ 404: ${brokenRedirectsCount}`);
  console.log(`- Số URL đích bị 404 duy nhất: ${brokenMap.size}`);

  // Sắp xếp các đích 404 được trỏ nhiều nhất
  const sortedBroken = Array.from(brokenMap.entries()).sort((a, b) => b[1] - a[1]);
  console.log('\nTop 25 URL đích bị 404 có nhiều lượt redirect trỏ về nhất:');
  sortedBroken.slice(0, 25).forEach(([dest, count], i) => {
    console.log(`  ${i + 1}. [${count} links trỏ vào] -> "${dest}" (404)`);
  });
}

main().catch(console.error);
