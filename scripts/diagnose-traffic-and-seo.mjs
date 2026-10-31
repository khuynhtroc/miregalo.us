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
  console.log('================================================================');
  console.log('🔍 BẮT ĐẦU ĐÁNH GIÁ VÀ PHÂN TÍCH TỔNG THỂ SEO & TRAFFIC MIREGALO');
  console.log('================================================================\n');

  // 1. Kiểm tra Site Settings
  console.log('1. KIỂM TRA SITE SETTINGS:');
  const { data: settings, error: sErr } = await sb.from('site_settings').select('*').limit(1).single();
  if (sErr) {
    console.error('Lỗi lấy settings:', sErr);
  } else {
    console.log(`   - Site Name: "${settings.site_name}"`);
    console.log(`   - Site URL: "${settings.site_url}"`);
    console.log(`   - Noindex Toàn Site (noindex_site): ${settings.noindex_site ? '❌ BẬT (CHẶN GOOGLE!)' : '✅ TẮT (Cho phép Google index)'}`);
    console.log(`   - GA4 ID: "${settings.ga4_id}"`);
    console.log(`   - GTM ID: "${settings.gtm_id}"`);
    console.log(`   - GSC Verification Code: "${settings.gsc_verification || 'Chưa có'}"`);
    console.log(`   - Bing Verification: "${settings.bing_verification || 'Chưa có'}"`);
    console.log(`   - Pinterest Tag: "${settings.pinterest_tag_id || 'Chưa có'}"`);
    console.log(`   - Robots Extra: "${settings.robots_extra || 'None'}"`);
  }

  // 2. Kiểm tra Posts
  console.log('\n2. KIỂM TRA TRẠNG THÁI TOÀN BỘ POSTS:');
  const { data: posts, error: pErr } = await sb.from('posts').select('id, slug, title, status, type, robots, published_at, updated_at');
  if (pErr) {
    console.error('Lỗi lấy posts:', pErr);
  } else {
    const statusCounts = {};
    const typeCounts = {};
    let noindexCount = 0;
    let missingPublishedAt = 0;
    let futureScheduled = 0;
    const now = new Date();

    posts.forEach(p => {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
      typeCounts[p.type] = (typeCounts[p.type] || 0) + 1;
      if (p.robots && p.robots.toLowerCase().includes('noindex')) noindexCount++;
      if (!p.published_at) missingPublishedAt++;
      else if (new Date(p.published_at) > now) futureScheduled++;
    });

    console.log(`   - Tổng số bài viết: ${posts.length}`);
    console.log('   - Phân bố theo Status:', statusCounts);
    console.log('   - Phân bố theo Type:', typeCounts);
    console.log(`   - Số bài bị đặt "noindex": ${noindexCount}`);
    console.log(`   - Số bài thiếu published_at: ${missingPublishedAt}`);
    console.log(`   - Số bài hẹn giờ tương lai (future scheduled): ${futureScheduled}`);
  }

  // 3. Kiểm tra live site HTTP endpoints
  console.log('\n3. KIỂM TRA LIVE SITE HTTP (STATUS, HEADERS, CANONICAL):');
  const urlsToCheck = [
    'https://www.miregalo.us/',
    'https://www.miregalo.us/robots.txt',
    'https://www.miregalo.us/sitemap.xml',
    'https://www.miregalo.us/feed',
    'https://www.miregalo.us/rss.xml',
    'https://www.miregalo.us/ideas-de-regalos-para-mama/',
    'https://www.miregalo.us/regalos-para-hombres/',
    'https://www.miregalo.us/velas-flotantes-candelabros-goticos-halloween/',
  ];

  for (const u of urlsToCheck) {
    try {
      const res = await fetch(u, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        },
        redirect: 'manual',
      });
      const xRobots = res.headers.get('x-robots-tag');
      const location = res.headers.get('location');
      const contentType = res.headers.get('content-type');
      console.log(`   - ${u} -> HTTP ${res.status} [${contentType || ''}] ${location ? `Redirect -> ${location}` : ''} ${xRobots ? `X-Robots: ${xRobots}` : ''}`);
    } catch (e) {
      console.error(`   ❌ Lỗi fetch ${u}:`, e.message);
    }
  }

  // 4. Kiểm tra nội dung live robots.txt
  console.log('\n4. NỘI DUNG LIVE ROBOTS.TXT:');
  try {
    const rRes = await fetch('https://www.miregalo.us/robots.txt');
    const rText = await rRes.text();
    console.log(rText.trim());
  } catch (e) {
    console.error('Lỗi lấy robots.txt:', e.message);
  }

  // 5. Kiểm tra live sitemap.xml
  console.log('\n5. KIỂM TRA LIVE SITEMAP.XML:');
  try {
    const sRes = await fetch('https://www.miregalo.us/sitemap.xml');
    const sText = await sRes.text();
    const locMatches = sText.match(/<loc>(.*?)<\/loc>/gi) || [];
    console.log(`   - Sitemap HTTP Status: ${sRes.status}`);
    console.log(`   - Tổng số URLs trong sitemap.xml: ${locMatches.length}`);
    if (locMatches.length > 0) {
      console.log('   - 5 URLs đầu tiên trong sitemap:');
      locMatches.slice(0, 5).forEach(m => console.log('     ', m.replace(/<\/?loc>/gi, '')));
    }
    // Kiểm tra xem có URL bị lỗi dạng localhost hoặc http:// không
    const nonHttps = locMatches.filter(m => !m.includes('https://www.miregalo.us/'));
    console.log(`   - Số URL không chuẩn https://www.miregalo.us/: ${nonHttps.length}`);
    if (nonHttps.length > 0) {
      console.log('   - Mẫu URL không chuẩn:', nonHttps.slice(0, 5));
    }
  } catch (e) {
    console.error('Lỗi kiểm tra sitemap.xml:', e.message);
  }

  // 6. Kiểm tra thẻ Canonical và Meta Robots trên Live Homepage & Top Post
  console.log('\n6. KIỂM TRA METATAGS TRÊN LIVE HOMEPAGE:');
  try {
    const hRes = await fetch('https://www.miregalo.us/');
    const hText = await hRes.text();
    const canonicalMatch = hText.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i) || hText.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
    const robotsMatch = hText.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i);
    const gtmFound = hText.includes('GTM-NLLPRRXN');
    const ga4Found = hText.includes('G-WRGWXTNWV3');
    const adsenseFound = hText.includes('ca-pub-2959580292222970');
    console.log(`   - Canonical URL: ${canonicalMatch ? canonicalMatch[1] : '❌ KHÔNG TÌM THẤY'}`);
    console.log(`   - Meta Robots: ${robotsMatch ? robotsMatch[1] : 'Mặc định (index, follow)'}`);
    console.log(`   - GTM-NLLPRRXN có trong mã nguồn: ${gtmFound ? '✅ CÓ' : '❌ KHÔNG'}`);
    console.log(`   - GA4 (G-WRGWXTNWV3) có trong mã nguồn: ${ga4Found ? '✅ CÓ' : '❌ KHÔNG'}`);
    console.log(`   - AdSense (ca-pub-2959580292222970) có trong mã nguồn: ${adsenseFound ? '✅ CÓ' : '❌ KHÔNG'}`);
  } catch (e) {
    console.error('Lỗi kiểm tra homepage:', e.message);
  }
}

main().catch(console.error);
