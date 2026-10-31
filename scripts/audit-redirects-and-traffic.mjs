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
  console.log('=== KIỂM TRA TOÀN DIỆN VỀ BÀI VIẾT, REDIRECT VÀ HỆ THỐNG ===\n');

  // 1. Phân loại bài viết theo status
  const { data: statusCounts } = await sb.from('posts').select('status');
  const countByStatus = {};
  statusCounts.forEach(p => {
    countByStatus[p.status] = (countByStatus[p.status] || 0) + 1;
  });
  console.log('1. THỐNG KÊ BÀI VIẾT THEO STATUS:');
  console.log(countByStatus);

  // 2. Kiểm tra bài viết planned
  const { data: plannedPosts } = await sb.from('posts').select('id, slug, title, published_at').eq('status', 'planned');
  console.log(`\n2. BÀI VIẾT PLANNED (${plannedPosts?.length || 0}):`);
  plannedPosts?.slice(0, 10).forEach(p => console.log(`  - ${p.published_at} | ${p.slug}`));

  // 3. Phân bố bài viết theo tháng (published_at)
  const { data: dates } = await sb.from('posts').select('published_at, created_at').eq('status', 'published');
  const byMonth = {};
  dates.forEach(p => {
    const d = p.published_at || p.created_at;
    if (d) {
      const ym = d.substring(0, 7);
      byMonth[ym] = (byMonth[ym] || 0) + 1;
    }
  });
  console.log('\n3. BÀI VIẾT THEO THÁNG:');
  console.log(byMonth);

  // 4. Kiểm tra redirect rules: Lấy mẫu 1000 redirect rules ngẫu nhiên và check xem target có tồn tại không
  const { data: redirects, count: totalRedirects } = await sb.from('redirects').select('source_path, target_path, status_code', { count: 'exact' }).limit(100);
  console.log(`\n4. TỔNG SỐ REDIRECT RULES: ${totalRedirects}`);
  
  // Kiểm tra xem target_path dẫn tới đâu?
  let targetInPosts = 0;
  let targetNotFound = 0;
  const sampleTargets = redirects.slice(0, 30);
  
  for (const r of sampleTargets) {
    const cleanTarget = r.target_path.replace(/^\/|\/$/g, '');
    const { data: post } = await sb.from('posts').select('id, slug, status').eq('slug', cleanTarget).maybeSingle();
    if (post) {
      targetInPosts++;
    } else {
      targetNotFound++;
      console.log(`  ❌ DEAD TARGET: ${r.source_path} -> ${r.target_path}`);
    }
  }
  console.log(`\nTrong mẫu 30 redirects: ${targetInPosts} trỏ đến bài viết có thật, ${targetNotFound} trỏ đến URL không tồn tại trong posts!`);

  // 5. Kiểm tra catalog_urls vs categories
  const { data: categories } = await sb.from('categories').select('id, name, slug');
  console.log(`\n5. TỔNG SỐ DANH MỤC: ${categories?.length || 0}`);
  categories?.slice(0, 10).forEach(c => console.log(`  - ${c.name} (/${c.slug}/)`));
}

main().catch(console.error);
