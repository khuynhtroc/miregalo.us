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
  console.log('=== QUÉT TOÀN BỘ ẢNH TRÊN MIREGALO.US ===');
  
  // 1. Quét settings
  const { data: settings } = await sb.from('site_settings').select('*').limit(1).single();
  const settingsImages = [];
  if (settings) {
    ['logo_url', 'favicon_url', 'default_og_image'].forEach(k => {
      if (settings[k]) settingsImages.push({ type: 'setting', field: k, url: settings[k] });
    });
  }

  // 2. Quét categories
  const { data: categories } = await sb.from('categories').select('id, slug, name, hero_image');
  const catImages = [];
  categories?.forEach(c => {
    if (c.hero_image) catImages.push({ type: 'category', id: c.id, slug: c.slug, url: c.hero_image });
  });

  // 3. Quét posts
  const { data: posts, error } = await sb.from('posts').select('id, slug, status, hero_image, items, content_html, intro_html');
  if (error) {
    console.error('Lỗi lấy posts:', error);
    return;
  }

  const postHeroImages = [];
  const postItemImages = [];
  const contentImages = [];

  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;

  posts.forEach(p => {
    if (p.hero_image) {
      postHeroImages.push({ postId: p.id, slug: p.slug, url: p.hero_image });
    }
    if (Array.isArray(p.items)) {
      p.items.forEach((it, idx) => {
        const img = it.image || it.image_url;
        if (img) {
          postItemImages.push({ postId: p.id, slug: p.slug, itemIdx: idx, url: img });
        }
      });
    }
    if (p.content_html) {
      let m;
      while ((m = imgRegex.exec(p.content_html)) !== null) {
        contentImages.push({ postId: p.id, slug: p.slug, field: 'content_html', url: m[1] });
      }
    }
    if (p.intro_html) {
      let m;
      while ((m = imgRegex.exec(p.intro_html)) !== null) {
        contentImages.push({ postId: p.id, slug: p.slug, field: 'intro_html', url: m[1] });
      }
    }
  });

  console.log(`- Categories có ảnh: ${catImages.length}`);
  console.log(`- Posts có hero_image: ${postHeroImages.length} / ${posts.length}`);
  console.log(`- Item images tìm thấy: ${postItemImages.length}`);
  console.log(`- Content HTML images: ${contentImages.length}`);

  // Tổng hợp URL duy nhất
  const allUrlsMap = new Map();
  function addUrl(it, source) {
    if (!it.url) return;
    const cleanUrl = it.url.trim();
    if (!allUrlsMap.has(cleanUrl)) {
      allUrlsMap.set(cleanUrl, []);
    }
    allUrlsMap.get(cleanUrl).push(it);
  }

  catImages.forEach(it => addUrl(it, 'category'));
  postHeroImages.forEach(it => addUrl(it, 'hero'));
  postItemImages.forEach(it => addUrl(it, 'item'));
  contentImages.forEach(it => addUrl(it, 'content'));

  console.log(`\nTổng số URL ảnh DUY NHẤT cần kiểm tra: ${allUrlsMap.size}`);

  // Phân loại theo domain
  const domains = {};
  for (const u of allUrlsMap.keys()) {
    try {
      const parsed = new URL(u);
      domains[parsed.hostname] = (domains[parsed.hostname] || 0) + 1;
    } catch {
      domains['invalid_or_relative'] = (domains['invalid_or_relative'] || 0) + 1;
    }
  }

  console.log('Thống kê domain của ảnh:', domains);

  fs.writeFileSync('scripts/all-images-audit.json', JSON.stringify({
    totalUnique: allUrlsMap.size,
    domains,
    urls: Array.from(allUrlsMap.keys())
  }, null, 2));

  console.log('\nĐã lưu danh sách vào scripts/all-images-audit.json');
}

main().catch(console.error);
