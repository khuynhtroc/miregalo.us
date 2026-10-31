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
  console.log('=== PHÂN TÍCH CHUYÊN SÂU SEO & TRAFFIC ===\n');

  // 1. Settings
  console.log('1. ĐỌC BẢNG SETTINGS:');
  const { data: settingsRows, error: sErr } = await sb.from('settings').select('*');
  if (sErr) console.error('Lỗi settings:', sErr);
  else {
    settingsRows.forEach(r => {
      console.log(`- Key: ${r.key}`);
      if (r.key === 'site') {
        const v = r.value;
        console.log('  site_name:', v.site_name);
        console.log('  site_url:', v.site_url);
        console.log('  noindex_site:', v.noindex_site);
        console.log('  gsc_verification:', v.gsc_verification);
        console.log('  ga4_id:', v.ga4_id);
        console.log('  gtm_id:', v.gtm_id);
        console.log('  ahrefs_key:', v.ahrefs_key);
        console.log('  robots_extra:', v.robots_extra);
      }
    });
  }

  // 2. Redirects
  console.log('\n2. KIỂM TRA BẢNG REDIRECTS:');
  const { data: redirects, count: redCount } = await sb.from('redirects').select('*', { count: 'exact' });
  console.log(`- Tổng số redirect rules: ${redCount}`);
  if (redirects && redirects.length > 0) {
    console.log('Sample 10 redirects:');
    redirects.slice(0, 10).forEach(r => console.log(`  ${r.source} -> ${r.destination} (${r.status_code || 301})`));
  }

  // 3. Catalog URLs
  console.log('\n3. KIỂM TRA CATALOG_URLS:');
  const { data: catalogUrls, count: catCount } = await sb.from('catalog_urls').select('*', { count: 'exact' });
  console.log(`- Tổng số Catalog URLs: ${catCount}`);
  if (catalogUrls && catalogUrls.length > 0) {
    console.log('Sample 10 Catalog URLs:');
    catalogUrls.slice(0, 10).forEach(c => console.log(`  [${c.url_type}] ${c.url} -> Priority: ${c.priority}`));
  }

  // 4. Kiểm tra mã nguồn live trang chủ tìm Verification tags
  console.log('\n4. KIỂM TRA LIVE HOMEPAGE VERIFICATION & META TAGS:');
  const homeRes = await fetch('https://www.miregalo.us/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
  });
  const homeHtml = await homeRes.text();
  const gscMeta = homeHtml.match(/<meta[^>]+name=["']google-site-verification["'][^>]+content=["']([^"']+)["']/i);
  console.log('Google Site Verification Meta tag:', gscMeta ? gscMeta[0] : '❌ KHÔNG TÌM THẤY');
  
  const bingMeta = homeHtml.match(/<meta[^>]+name=["']msvalidate\.01["'][^>]+content=["']([^"']+)["']/i);
  console.log('Bing Verification Meta tag:', bingMeta ? bingMeta[0] : '❌ KHÔNG TÌM THẤY');

  // 5. Kiểm tra thời gian xuất bản các bài viết gần đây
  console.log('\n5. KIỂM TRA LỊCH SỬ BÀI ĐĂNG GẦN ĐÂY:');
  const { data: recentPosts } = await sb
    .from('posts')
    .select('id, slug, title, status, published_at, created_at')
    .order('published_at', { ascending: false })
    .limit(30);

  console.log('30 bài viết mới nhất theo published_at:');
  recentPosts?.slice(0, 15).forEach((p, idx) => {
    console.log(`  ${idx + 1}. [${p.status}] ${p.published_at?.split('T')[0]} | ${p.slug} | ${p.title?.slice(0, 50)}`);
  });

  // 6. Kiểm tra URL bài viết có chứa đuôi slash vs không slash
  console.log('\n6. KIỂM TRA REDIRECT VÀ TRAILING SLASH:');
  const testTrailing = [
    'https://www.miregalo.us/velas-flotantes-candelabros-goticos-halloween',
    'https://www.miregalo.us/velas-flotantes-candelabros-goticos-halloween/',
    'https://miregalo.us/velas-flotantes-candelabros-goticos-halloween/',
    'http://www.miregalo.us/velas-flotantes-candelabros-goticos-halloween/',
  ];
  for (const t of testTrailing) {
    const res = await fetch(t, { redirect: 'manual' });
    console.log(`  ${t} -> HTTP ${res.status} [Location: ${res.headers.get('location') || 'NONE'}]`);
  }
}

main().catch(console.error);
