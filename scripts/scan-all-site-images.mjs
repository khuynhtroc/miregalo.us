import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

// Load .env.local
const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

async function getAllPosts() {
  console.log('1. Đang tải toàn bộ bài viết từ Supabase...');
  const allPosts = [];
  const BATCH_SIZE = 1000;
  let offset = 0;
  while (true) {
    const { data, error } = await sb
      .from('posts')
      .select('id, slug, title, status, hero_image, items, content_html, intro_html')
      .range(offset, offset + BATCH_SIZE - 1);
    
    if (error) {
      console.error('Lỗi tải posts:', error);
      break;
    }
    if (!data || data.length === 0) break;
    allPosts.push(...data);
    offset += data.length;
    if (data.length < BATCH_SIZE) break;
  }
  console.log(`   -> Đã tải thành công ${allPosts.length} bài viết.`);
  return allPosts;
}

async function getAllR2Keys() {
  console.log('2. Đang quét danh mục toàn bộ file trong Cloudflare R2 bucket: media-miregalo...');
  const r2KeySet = new Set();
  let continuationToken = undefined;
  let batchCount = 0;

  do {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
      ContinuationToken: continuationToken,
      MaxKeys: 1000,
    }));

    if (res.Contents) {
      for (const obj of res.Contents) {
        if (obj.Key) r2KeySet.add(obj.Key);
      }
    }
    continuationToken = res.NextContinuationToken;
    batchCount++;
    if (batchCount % 10 === 0) {
      console.log(`   ... Đã nạp ${r2KeySet.size} keys từ R2...`);
    }
  } while (continuationToken);

  console.log(`   -> Tổng số file tồn tại trong R2: ${r2KeySet.size} files.`);
  return r2KeySet;
}

async function checkHttpUrl(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) return { ok: true, status: res.status };
    if (res.status === 405 || res.status === 403) {
      // Thử GET nếu server chặn HEAD
      const getCtrl = new AbortController();
      const getTimeout = setTimeout(() => getCtrl.abort(), 6000);
      const getRes = await fetch(url, {
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Range': 'bytes=0-10' },
        signal: getCtrl.signal,
      });
      clearTimeout(getTimeout);
      return { ok: getRes.ok || getRes.status === 206, status: getRes.status };
    }
    return { ok: false, status: res.status };
  } catch (err) {
    return { ok: false, status: 0, error: err.message };
  }
}

async function main() {
  console.log('================================================================');
  console.log('🔍 BẮT ĐẦU RÀ SOÁT TOÀN BỘ ẢNH TRÊN SITE MIREGALO.US');
  console.log('================================================================\n');

  const posts = await getAllPosts();
  const r2KeySet = await getAllR2Keys();

  // Thu thập mọi URL ảnh
  console.log('\n3. Đang trích xuất và lập danh mục toàn bộ link ảnh...');
  const imageOccurrences = []; // { url, location, postId, slug, title, itemIdx, itemHeading }

  // A. Categories
  const { data: categories } = await sb.from('categories').select('id, slug, name, hero_image');
  categories?.forEach(c => {
    if (c.hero_image) {
      imageOccurrences.push({
        url: c.hero_image,
        location: 'category_hero',
        slug: c.slug,
        title: c.name,
      });
    }
  });

  // B. Settings
  const { data: settings } = await sb.from('site_settings').select('*').limit(1).single();
  if (settings) {
    ['logo_url', 'favicon_url', 'default_og_image'].forEach(k => {
      if (settings[k]) {
        imageOccurrences.push({
          url: settings[k],
          location: `setting_${k}`,
          slug: 'settings',
        });
      }
    });
  }

  // C. Posts
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  posts.forEach(p => {
    if (p.hero_image) {
      imageOccurrences.push({
        url: p.hero_image,
        location: 'post_hero',
        postId: p.id,
        slug: p.slug,
        title: p.title,
        status: p.status,
      });
    }
    if (Array.isArray(p.items)) {
      p.items.forEach((it, idx) => {
        const img = it.image || it.image_url;
        if (img) {
          imageOccurrences.push({
            url: img,
            location: 'post_item',
            postId: p.id,
            slug: p.slug,
            title: p.title,
            status: p.status,
            itemIdx: idx,
            itemHeading: it.heading || it.title,
          });
        }
      });
    }
    if (p.content_html) {
      let m;
      while ((m = imgRegex.exec(p.content_html)) !== null) {
        imageOccurrences.push({
          url: m[1],
          location: 'post_content_html',
          postId: p.id,
          slug: p.slug,
          title: p.title,
          status: p.status,
        });
      }
    }
    if (p.intro_html) {
      let m;
      while ((m = imgRegex.exec(p.intro_html)) !== null) {
        imageOccurrences.push({
          url: m[1],
          location: 'post_intro_html',
          postId: p.id,
          slug: p.slug,
          title: p.title,
          status: p.status,
        });
      }
    }
  });

  console.log(`   -> Tổng số lần xuất hiện ảnh: ${imageOccurrences.length}`);

  // Gom nhóm theo URL duy nhất
  const urlMap = new Map();
  imageOccurrences.forEach(occ => {
    const rawUrl = occ.url ? occ.url.trim() : '';
    if (!urlMap.has(rawUrl)) {
      urlMap.set(rawUrl, []);
    }
    urlMap.get(rawUrl).push(occ);
  });

  console.log(`   -> Tổng số link ảnh DUY NHẤT: ${urlMap.size}`);

  // 4. Kiểm tra từng URL
  console.log('\n4. Đang kiểm tra tính hợp lệ và lỗi 404 cho từng link ảnh...');
  const brokenImages = [];
  const r2Domain = 'media.miregalo.us';

  let checkedCount = 0;
  const externalToCheck = [];

  for (const [rawUrl, occList] of urlMap.entries()) {
    checkedCount++;
    if (!rawUrl || rawUrl === '' || rawUrl === 'EMPTY') {
      brokenImages.push({
        url: rawUrl,
        reason: 'URL rỗng / thiếu',
        status: 404,
        occurrences: occList,
      });
      continue;
    }

    // Kiểm tra định dạng URL
    let parsed = null;
    try {
      parsed = new URL(rawUrl);
    } catch (e) {
      brokenImages.push({
        url: rawUrl,
        reason: 'URL không hợp lệ / đường dẫn tương đối lỗi',
        status: 404,
        occurrences: occList,
      });
      continue;
    }

    if (parsed.hostname === r2Domain) {
      // URL nằm trên Cloudflare R2
      // Ví dụ: https://media.miregalo.us/media/heroes/xxx.jpg -> key: media/heroes/xxx.jpg
      let key = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
      if (r2KeySet.has(key)) {
        // Tồn tại trong R2
        continue;
      }
      // Thử xem có biến thể key khác không (ví dụ bỏ media/ hoặc thêm media/)
      if (key.startsWith('media/') && r2KeySet.has(key.replace(/^media\//, ''))) {
        continue;
      }
      if (!key.startsWith('media/') && r2KeySet.has(`media/${key}`)) {
        continue;
      }

      // Nếu không tìm thấy trong R2 Set, đánh dấu để kiểm tra lại bằng HTTP HEAD
      externalToCheck.push({ url: rawUrl, occList, reason: 'Không tìm thấy file trong R2 Bucket' });
    } else {
      // Domain bên ngoài (Google, Imgur, Shopify, etc.)
      externalToCheck.push({ url: rawUrl, occList, reason: `Ảnh từ bên thứ ba: ${parsed.hostname}` });
    }
  }

  console.log(`   - Số ảnh trên R2 hợp lệ tức thì: ${urlMap.size - externalToCheck.length - brokenImages.length}`);
  console.log(`   - Số ảnh cần kiểm tra qua HTTP (bao gồm ảnh nghi ngờ thiếu trong R2 và ảnh external): ${externalToCheck.length}`);

  // Kiểm tra qua HTTP cho các link nghi vấn
  console.log('   Đang kiểm tra HTTP cho các URL nghi vấn...');
  const CONCURRENCY = 15;
  for (let i = 0; i < externalToCheck.length; i += CONCURRENCY) {
    const chunk = externalToCheck.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(async item => {
      const res = await checkHttpUrl(item.url);
      if (!res.ok) {
        brokenImages.push({
          url: item.url,
          reason: `${item.reason} (HTTP ${res.status || 'Timeout/Lỗi'})`,
          status: res.status || 404,
          occurrences: item.occList,
        });
      }
    }));
    if ((i + CONCURRENCY) % 150 === 0 || i + CONCURRENCY >= externalToCheck.length) {
      console.log(`   ... Đã kiểm tra HTTP ${Math.min(i + CONCURRENCY, externalToCheck.length)} / ${externalToCheck.length}...`);
    }
  }

  console.log('\n================================================================');
  console.log('📊 KẾT QUẢ RÀ SOÁT ẢNH:');
  console.log('================================================================');
  console.log(`- Tổng số link ảnh duy nhất: ${urlMap.size}`);
  console.log(`- Ảnh hoạt động tốt (200 OK): ${urlMap.size - brokenImages.length}`);
  console.log(`- Ảnh BỊ LỖI (404 / Không tồn tại): ${brokenImages.length}`);

  // Phân loại ảnh lỗi
  const brokenByLocation = {
    post_hero: 0,
    post_item: 0,
    post_content_html: 0,
    post_intro_html: 0,
    category_hero: 0,
    setting: 0,
  };

  brokenImages.forEach(b => {
    b.occurrences.forEach(occ => {
      if (occ.location.startsWith('setting')) brokenByLocation.setting++;
      else if (brokenByLocation[occ.location] !== undefined) brokenByLocation[occ.location]++;
    });
  });

  console.log('\nPhân loại vị trí ảnh lỗi:', brokenByLocation);

  // Lưu báo cáo chi tiết
  fs.writeFileSync('scripts/broken-images-report.json', JSON.stringify({
    summary: {
      totalUniqueImages: urlMap.size,
      healthyImages: urlMap.size - brokenImages.length,
      brokenImagesCount: brokenImages.length,
      brokenByLocation,
    },
    brokenImages,
  }, null, 2));

  console.log('\n📄 Chi tiết danh sách ảnh lỗi đã lưu vào scripts/broken-images-report.json');

  if (brokenImages.length > 0) {
    console.log('\nTop 15 ảnh lỗi đầu tiên:');
    brokenImages.slice(0, 15).forEach((b, idx) => {
      console.log(`${idx + 1}. [HTTP ${b.status}] ${b.url}`);
      console.log(`   Lý do: ${b.reason}`);
      console.log(`   Vị trí (${b.occurrences.length} lần xuất hiện):`);
      b.occurrences.slice(0, 3).forEach(occ => {
        console.log(`     - [${occ.location}] Bài viết: ${occ.slug} ${occ.itemHeading ? `(Item: ${occ.itemHeading})` : ''}`);
      });
    });
  }
}

main().catch(console.error);
