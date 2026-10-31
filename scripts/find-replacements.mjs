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
  // 1. Kiểm tra post regalos-summer
  const { data: summerPost } = await sb.from('posts').select('id, items').eq('slug', 'regalos-summer').single();
  if (summerPost) {
    summerPost.items.forEach((it, idx) => {
      const img = it.image || it.image_url;
      if (img && img.includes('loveable.ai')) {
        console.log(`regalos-summer item #${idx + 1}: ${it.heading} -> ${img}`);
      }
    });
  }

  // 2. Tìm ảnh aromatherapy / shower trong R2
  const res = await s3.send(new ListObjectsV2Command({
    Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
    Prefix: 'media/blog/uploads/',
    MaxKeys: 1000,
  }));
  
  // Lấy các ảnh có sẵn trong R2 để làm hero và item cho Halloween
  console.log('\n--- TÌM ẢNH THAY THẾ CHO HALLOWEEN TRONG R2 ---');
  const halloweenImages = [];
  let token = undefined;
  do {
    const r2List = await s3.send(new ListObjectsV2Command({
      Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
      ContinuationToken: token,
      MaxKeys: 1000,
    }));
    r2List.Contents?.forEach(c => {
      if (c.Key && (c.Key.toLowerCase().includes('halloween') || c.Key.toLowerCase().includes('pumpkin') || c.Key.toLowerCase().includes('spooky') || c.Key.toLowerCase().includes('bruja'))) {
        halloweenImages.push(c.Key);
      }
    });
    token = r2List.NextContinuationToken;
  } while (token && halloweenImages.length < 50);

  console.log(`Tìm thấy ${halloweenImages.length} ảnh Halloween trong R2:`);
  halloweenImages.slice(0, 10).forEach(k => console.log('  https://media.miregalo.us/' + k));
}

main().catch(console.error);
