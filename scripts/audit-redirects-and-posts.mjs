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
  console.log('=== ĐỐI SOÁT REDIRECTS VÀ DỮ LIỆU POSTS TRÊN SUPABASE ===\n');

  // 1. Tải toàn bộ posts
  console.log('1. Tải danh sách toàn bộ bài viết trong database...');
  const allPosts = [];
  let offset = 0;
  while (true) {
    const { data, error } = await sb.from('posts').select('id, slug, title, status, type').range(offset, offset + 999);
    if (error || !data || data.length === 0) break;
    allPosts.push(...data);
    offset += data.length;
    if (data.length < 1000) break;
  }
  console.log(`-> Tổng số posts: ${allPosts.length}`);

  const postSlugs = new Set(allPosts.map(p => p.slug));
  const giftSlugs = new Set(allPosts.filter(p => p.type === 'gift' || p.type === 'page').map(p => p.slug));
  const blogSlugs = new Set(allPosts.filter(p => p.type === 'blog').map(p => p.slug));

  // Tải toàn bộ categories
  const { data: categories } = await sb.from('categories').select('id, slug');
  const catSlugs = new Set(categories?.map(c => c.slug) || []);

  // Tải toàn bộ catalog URLs
  const { data: catalogUrls } = await sb.from('catalog_urls').select('url');
  const catalogPaths = new Set(catalogUrls?.map(c => c.url.replace(/\/$/, '').replace(/^\//, '')) || []);

  // 2. Tìm bài viết liên quan đến Valentine
  console.log('\n2. TÌM KIẾM BÀI VIẾT LIÊN QUAN ĐẾN SAN VALENTIN:');
  const valPosts = allPosts.filter(p => p.slug.includes('valentin') || p.title.toLowerCase().includes('valent'));
  console.log(`Tìm thấy ${valPosts.length} bài viết về San Valentín:`);
  valPosts.slice(0, 10).forEach(p => console.log(`  [${p.type}] /${p.slug}/ -> ${p.title.slice(0, 50)}`));

  // 3. Tải và kiểm tra các redirects
  console.log('\n3. ĐỐI SOÁT BẢNG REDIRECTS (31.723 DÒNG)...');
  const { data: redirects, count: totalRedirects } = await sb.from('redirects').select('source, destination, active');
  console.log(`Đã tải ${redirects.length} redirects để phân tích.`);

  let brokenDestinationsCount = 0;
  const brokenDestinationsSample = [];

  for (const r of redirects) {
    if (!r.active) continue;
    let dest = r.destination.trim();
    // Bỏ trailing slash và leading slash để lấy slug
    const cleanDest = dest.replace(/^\/+/, '').replace(/\/+$/, '');
    
    // Kiểm tra xem dest trỏ về đâu:
    // A. Root hoặc Home: '/'
    if (cleanDest === '') continue;

    // B. Category hoặc Catalog URL
    if (catSlugs.has(cleanDest) || catalogPaths.has(cleanDest)) continue;

    // C. Blog post: /blog/xyz/
    if (dest.startsWith('/blog/')) {
      const bSlug = cleanDest.replace(/^blog\//, '');
      if (blogSlugs.has(bSlug)) continue;
    }

    // D. Regular post: /xyz/
    if (giftSlugs.has(cleanDest) || postSlugs.has(cleanDest)) continue;

    // Nếu không khớp bất kỳ cái nào -> Destination bị 404!
    brokenDestinationsCount++;
    if (brokenDestinationsSample.length < 20) {
      brokenDestinationsSample.push({ source: r.source, destination: r.destination });
    }
  }

  console.log(`\n🚨 KẾT QUẢ PHÂN TÍCH REDIRECTS:`);
  console.log(`- Tổng số redirects đã quét: ${redirects.length}`);
  console.log(`- Số redirect trỏ vào ĐÍCH BỊ 404 / KHÔNG TỒN TẠI: ${brokenDestinationsCount} (Tỷ lệ: ${((brokenDestinationsCount / redirects.length) * 100).toFixed(1)}%)`);

  if (brokenDestinationsSample.length > 0) {
    console.log('\n20 MẪU REDIRECT BỊ TRỎ VÀO TRANG 404:');
    brokenDestinationsSample.forEach((b, idx) => {
      console.log(`  ${idx + 1}. Source: "${b.source}" -> Destination: "${b.destination}" (404)`);
    });
  }
}

main().catch(console.error);
