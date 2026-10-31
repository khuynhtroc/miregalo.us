import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

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

async function main() {
  console.log('--- XỬ LÝ 2 ẢNH CUỐI CÙNG ---');

  // 1. Sửa item trong regalos-dog-memorial
  // Tìm ảnh nến/chó trong R2
  const r2Res = await s3.send(new ListObjectsV2Command({
    Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
    Prefix: 'media/blog/uploads/2023/05/',
    MaxKeys: 100,
  }));
  const dogKey = r2Res.Contents?.find(c => c.Key.toLowerCase().includes('dog') || c.Key.toLowerCase().includes('candle') || c.Key.toLowerCase().includes('pet'))?.Key
    || 'media/blog/uploads/2023/04/18041529/Halloween-Flickering-Candles.jpg';

  const validCandleUrl = `https://media.miregalo.us/${dogKey}`;
  console.log('Chọn ảnh nến thay thế:', validCandleUrl);

  const { data: dogPost } = await sb.from('posts').select('id, items').eq('slug', 'regalos-dog-memorial').single();
  if (dogPost && Array.isArray(dogPost.items)) {
    dogPost.items.forEach(it => {
      if ((it.image && it.image.includes('Screenshot-2024-03-11')) || (it.image_url && it.image_url.includes('Screenshot-2024-03-11'))) {
        it.image = validCandleUrl;
        it.image_url = validCandleUrl;
      }
    });
    await sb.from('posts').update({ items: dogPost.items }).eq('id', dogPost.id);
    console.log('✓ Đã cập nhật xong ảnh cho regalos-dog-memorial');
  }

  // 2. Sửa bài regalos-diy-cumpleanos-decoration
  const { data: bdayPost } = await sb.from('posts').select('id, content_html').eq('slug', 'regalos-diy-cumpleanos-decoration').single();
  if (bdayPost && bdayPost.content_html) {
    const idx = bdayPost.content_html.indexOf('DwuVTSny0GPKaAcoeEhNGP7W71TeFyvXGQE_Bkwr0j_ojW7V681zaHhg2OxF_Lz66xNd6yb21v');
    console.log('Found DwuVTSny at index:', idx);
    if (idx !== -1) {
      console.log('Surrounding HTML:', bdayPost.content_html.slice(Math.max(0, idx - 100), idx + 200));
      // Xóa mọi figure hoặc img chứa DwuVTSny
      let html = bdayPost.content_html;
      html = html.replace(/<figure[^>]*>[\s\S]*?DwuVTSny0GPKaAcoeEhNGP7W71TeFyvXGQE_Bkwr0j_ojW7V681zaHhg2OxF_Lz66xNd6yb21v[\s\S]*?<\/figure>/gi, '');
      html = html.replace(/<img[^>]+src=["'][^"']*DwuVTSny0GPKaAcoeEhNGP7W71TeFyvXGQE_Bkwr0j_ojW7V681zaHhg2OxF_Lz66xNd6yb21v[^"']*["'][^>]*>/gi, '');
      const { error: updErr } = await sb.from('posts').update({ content_html: html.trim() }).eq('id', bdayPost.id);
      console.log('Update result:', updErr || 'SUCCESS!');
    }
  }
}

main().catch(console.error);
