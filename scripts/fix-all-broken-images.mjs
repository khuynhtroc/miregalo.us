import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const VALID_HALLOWEEN_HEROES = [
  'https://media.miregalo.us/media/blog/uploads/2023/03/31085446/Halloween-Sweatshirt-Vintage.jpg',
  'https://media.miregalo.us/media/blog/uploads/2023/03/31100637/Hocus-Halloween-Pocus-Blankets.jpg',
  'https://media.miregalo.us/media/blog/uploads/2023/04/18041529/Halloween-Flickering-Candles.jpg',
  'https://media.miregalo.us/media/blog/uploads/2023/04/27012513/Halloween-Sweatshirt-and-Hoodie.jpg',
  'https://media.miregalo.us/media/blog/uploads/2023/05/27080900/Halloween-Wedding-Welcome-Sign.jpg',
  'https://media.miregalo.us/media/Boo_Halloween_Lift_a_Flap_Board_Book_82ab25aeae/Boo_Halloween_Lift_a_Flap_Board_Book_82ab25aeae.jpg',
  'https://media.miregalo.us/media/Boo_You_Whore_Funny_Halloween_Decor_Halloween_Candle_51ae33bda0/Boo_You_Whore_Funny_Halloween_Decor_Halloween_Candle_51ae33bda0.jpg',
  'https://media.miregalo.us/media/Happy_Halloween_Flip_a_Flap_Lift_a_Flap_Board_Book_8ee8bba01d/Happy_Halloween_Flip_a_Flap_Lift_a_Flap_Board_Book_8ee8bba01d.png',
  'https://media.miregalo.us/media/blog/regalos-halloween-cake-halloween-cakes-pumpkin-patch-chocolate-peanut-butter-cake-1665093996.jpeg',
  'https://media.miregalo.us/media/blog/uploads/2023/03/14074612/preparing-to-cut-open-a-pumpkin-960x597.jpg'
];

const VALID_HALLOWEEN_ITEMS = [
  'https://media.miregalo.us/media/blog/uploads/2023/03/31091425/Halloween-Charms-Fits-for-Clog-Sandals-Shoes-Decoration.jpg',
  'https://media.miregalo.us/media/blog/uploads/2023/03/31125344/Halloween-Makeup-Bag.jpg',
  'https://media.miregalo.us/media/blog/uploads/2023/03/31132309/Hocus-Pocus-Halloween-Decor.jpg',
  'https://media.miregalo.us/media/blog/uploads/2023/04/27011810/Halloween-Scream-Birthday-Card.jpg',
  'https://media.miregalo.us/media/blog/uploads/2023/04/27021752/Jason-Slasher-Halloween-Concrete-Planter.jpg'
];

const AROMATHERAPY_REPLACEMENT = 'https://media.miregalo.us/media/blog/uploads/2023/09/29144413/Chill-Out-at-a-Spa-Together.jpg';

const DEAD_UNSPLASH_1 = 'photo-1511253819057-1547ddb8fa53';
const DEAD_UNSPLASH_2 = 'photo-1511707171634-5f897ff02560';

async function main() {
  console.log('================================================================');
  console.log('🛠️ BẮT ĐẦU XỬ LÝ CHÍNH XÁC CÁC BÀI VIẾT CHỨA ẢNH LỖI (SIÊU NHANH)');
  console.log('================================================================\n');

  const report = JSON.parse(fs.readFileSync('scripts/broken-images-report.json', 'utf-8'));
  
  // Gom nhóm tất cả các bài viết bị lỗi và danh sách URL lỗi tương ứng
  const postsToFix = new Map(); // postId -> { slug, brokenHero: [], brokenItems: [], brokenContentUrls: [] }

  for (const b of report.brokenImages) {
    const rawUrl = b.url;
    for (const occ of b.occurrences) {
      if (!occ.postId && !occ.slug) continue;
      const key = occ.postId || occ.slug;
      if (!postsToFix.has(key)) {
        postsToFix.set(key, {
          postId: occ.postId,
          slug: occ.slug,
          brokenHero: false,
          brokenItems: [],
          brokenContentUrls: new Set(),
        });
      }
      const pData = postsToFix.get(key);
      if (occ.location === 'post_hero') {
        pData.brokenHero = true;
      } else if (occ.location === 'post_item') {
        pData.brokenItems.push({ idx: occ.itemIdx, url: rawUrl });
      } else if (occ.location === 'post_content_html') {
        pData.brokenContentUrls.add(rawUrl);
      }
    }
  }

  console.log(`Tìm thấy chính xác ${postsToFix.size} bài viết cần xử lý ảnh lỗi.`);

  let fixedHeroesCount = 0;
  let fixedItemsCount = 0;
  let fixedContentPostsCount = 0;
  let processedIndex = 0;

  for (const [key, fixInfo] of postsToFix.entries()) {
    processedIndex++;
    
    // Tải post từ Supabase
    let query = sb.from('posts').select('id, slug, hero_image, items, content_html');
    if (fixInfo.postId) {
      query = query.eq('id', fixInfo.postId);
    } else {
      query = query.eq('slug', fixInfo.slug);
    }
    const { data: post, error } = await query.single();
    if (error || !post) {
      console.warn(`[Bỏ qua] Không tìm thấy post: ${key}`);
      continue;
    }

    const updates = {};
    let changed = false;

    // 1. Sửa hero_image
    if (fixInfo.brokenHero && post.hero_image) {
      if (post.hero_image.includes(DEAD_UNSPLASH_1) || post.hero_image.includes(DEAD_UNSPLASH_2)) {
        updates.hero_image = VALID_HALLOWEEN_HEROES[processedIndex % VALID_HALLOWEEN_HEROES.length];
        changed = true;
        fixedHeroesCount++;
      }
    }

    // 2. Sửa items
    if (Array.isArray(post.items) && fixInfo.brokenItems.length > 0) {
      let itemsUpdated = false;
      const newItems = post.items.map((it, idx) => {
        const itImg = it.image || it.image_url;
        if (!itImg) return it;
        if (itImg.includes(DEAD_UNSPLASH_1) || itImg.includes(DEAD_UNSPLASH_2)) {
          const rep = VALID_HALLOWEEN_ITEMS[(processedIndex + idx) % VALID_HALLOWEEN_ITEMS.length];
          itemsUpdated = true;
          return { ...it, image: rep, image_url: rep };
        }
        if (itImg.includes('loveable.ai')) {
          itemsUpdated = true;
          return { ...it, image: AROMATHERAPY_REPLACEMENT, image_url: AROMATHERAPY_REPLACEMENT };
        }
        return it;
      });
      if (itemsUpdated) {
        updates.items = newItems;
        changed = true;
        fixedItemsCount++;
      }
    }

    // 3. Sửa content_html (Loại bỏ chính xác các ảnh bị 404/chết)
    if (post.content_html && fixInfo.brokenContentUrls.size > 0) {
      let html = post.content_html;
      let htmlModified = false;

      for (const badUrl of fixInfo.brokenContentUrls) {
        if (!html.includes(badUrl)) continue;

        // Escape URL để dùng trong regex an toàn
        const escapedUrl = badUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // A. Loại bỏ thẻ figure chứa badUrl
        const figureRegex = new RegExp(`<figure[^>]*>\\s*<img[^>]+src=["']${escapedUrl}["'][^>]*>\\s*(?:<figcaption[\\s\\S]*?<\\/figcaption>)?\\s*<\\/figure>`, 'gi');
        if (figureRegex.test(html)) {
          html = html.replace(figureRegex, '');
          htmlModified = true;
        }

        // B. Loại bỏ thẻ p chứa badUrl
        const pRegex = new RegExp(`<p[^>]*>\\s*<img[^>]+src=["']${escapedUrl}["'][^>]*>\\s*<\\/p>`, 'gi');
        if (pRegex.test(html)) {
          html = html.replace(pRegex, '');
          htmlModified = true;
        }

        // C. Loại bỏ thẻ img độc lập nếu còn
        const imgRegex = new RegExp(`<img[^>]+src=["']${escapedUrl}["'][^>]*>`, 'gi');
        if (imgRegex.test(html)) {
          html = html.replace(imgRegex, '');
          htmlModified = true;
        }
      }

      // Xóa thẻ <img src="#"> nếu có
      if (html.includes('src="#"')) {
        html = html.replace(/<img[^>]+src=["']#["'][^>]*>/gi, '');
        htmlModified = true;
      }

      if (htmlModified) {
        updates.content_html = html.trim();
        changed = true;
        fixedContentPostsCount++;
      }
    }

    // Lưu vào Supabase
    if (changed) {
      const { error: updErr } = await sb.from('posts').update(updates).eq('id', post.id);
      if (updErr) {
        console.error(`❌ Lỗi update post ${post.slug}:`, updErr.message);
      } else {
        console.log(`[${processedIndex}/${postsToFix.size}] ✓ Đã sửa ảnh lỗi cho bài: ${post.slug}`);
      }
    }
  }

  console.log('\n================================================================');
  console.log('🎉 HOÀN TẤT XỬ LÝ TOÀN BỘ ẢNH LỖI TRÊN MIREGALO.US!');
  console.log('================================================================');
  console.log(`- Đã sửa Hero Image: ${fixedHeroesCount} bài viết`);
  console.log(`- Đã sửa Item Image: ${fixedItemsCount} bài viết`);
  console.log(`- Đã dọn sạch ảnh lỗi trong nội dung: ${fixedContentPostsCount} bài viết`);
}

main().catch(console.error);
