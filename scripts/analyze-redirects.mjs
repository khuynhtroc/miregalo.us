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
  console.log('=== PHÂN TÍCH TỔNG QUAN BẢNG REDIRECTS ===');

  // Load all posts slugs
  const allPosts = new Set();
  let from = 0;
  const step = 1000;
  while (true) {
    const { data: posts, error } = await sb.from('posts').select('slug, status').range(from, from + step - 1);
    if (error || !posts || posts.length === 0) break;
    posts.forEach(p => {
      if (p.status === 'published') allPosts.add(p.slug.toLowerCase());
    });
    from += step;
    if (posts.length < step) break;
  }
  console.log(`Đã load ${allPosts.size} published post slugs vào bộ nhớ.`);

  // Load all categories slugs
  const { data: categories } = await sb.from('categories').select('slug');
  const allCats = new Set((categories || []).map(c => c.slug.toLowerCase()));
  console.log(`Đã load ${allCats.size} category slugs vào bộ nhớ.`);

  // Load catalog_urls
  const { data: catUrls } = await sb.from('catalog_urls').select('url');
  const allCatalogUrls = new Set((catUrls || []).map(u => u.url.toLowerCase().replace(/^\/|\/$/g, '')));
  console.log(`Đã load ${allCatalogUrls.size} catalog URLs vào bộ nhớ.`);

  // Check static pages
  const staticPages = new Set([
    'contacto', 'contact', 'sobre-nosotros', 'about', 'about-us', 'faqs', 'faq',
    'politica-de-privacidad', 'privacy', 'privacy-policy', 'terminos-y-condiciones',
    'terms', 'terms-and-conditions', 'politica-de-cookies', 'cookies', 'cookie-policy',
    'divulgacion-de-afiliados', 'affiliate', 'affiliate-disclosure', 'regalos', 'blog'
  ]);

  // Scan redirects table in batches
  let validTargets = 0;
  let deadTargets = 0;
  const deadList = [];

  let redFrom = 0;
  while (true) {
    const { data: batch, error } = await sb.from('redirects').select('id, source, destination, hits, active').range(redFrom, redFrom + step - 1);
    if (error || !batch || batch.length === 0) break;

    for (const r of batch) {
      if (!r.active) continue;
      const destClean = r.destination.toLowerCase().replace(/^\/|\/$/g, '');
      const isPost = allPosts.has(destClean);
      const isCat = allCats.has(destClean);
      const isCatUrl = allCatalogUrls.has(destClean);
      const isStatic = staticPages.has(destClean);

      if (isPost || isCat || isCatUrl || isStatic) {
        validTargets++;
      } else {
        deadTargets++;
        if (deadList.length < 50) {
          deadList.push({ source: r.source, destination: r.destination, hits: r.hits });
        }
      }
    }

    redFrom += step;
    if (batch.length < step) break;
  }

  console.log(`\nKẾT QUẢ QUÉT TOÀN BỘ REDIRECTS:`);
  console.log(`- Valid targets (trỏ đến trang tồn tại): ${validTargets}`);
  console.log(`- Dead targets (trỏ đến 404): ${deadTargets}`);
  console.log(`- Tỷ lệ dead targets: ${((deadTargets / (validTargets + deadTargets)) * 100).toFixed(2)}%`);

  console.log(`\nTop 20 dead redirects mẫu:`);
  deadList.slice(0, 20).forEach((d, i) => {
    console.log(`  ${i+1}. ${d.source} -> ${d.destination} (hits: ${d.hits})`);
  });
}

main().catch(console.error);
