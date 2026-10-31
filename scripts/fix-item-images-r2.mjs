import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

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

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// 8 problematic encoded keys in R2
const SPECIAL_ITEMS = [
  {
    rawKey: 'media/blog/uploads/2023/10/06232208/Mr.-Wattson%E2%84%A2-Table-Lamp.jpg',
    cleanKey: 'media/blog/uploads/2023/10/06232208/Mr.-Wattson-Table-Lamp.jpg',
    postId: 'post-regalos-divertidos-60th-cumpleanos',
  },
  {
    rawKey: 'media/blog/uploads/2023/10/26074716/%EF%BB%BFCustomized-Teacher-Life-Sweatshirt.jpg',
    cleanKey: 'media/blog/uploads/2023/10/26074716/Customized-Teacher-Life-Sweatshirt.jpg',
    postId: 'post-regalos-para-music-teachers',
  },
  {
    rawKey: 'media/blog/uploads/2023/12/28102857/Shes-Birdie%E2%80%93The-Original-Personal-Safety-Alarm.jpg',
    cleanKey: 'media/blog/uploads/2023/12/28102857/Shes-Birdie-The-Original-Personal-Safety-Alarm.jpg',
    postId: 'post-regalos-para-women-in-their-30s',
  },
  {
    rawKey: 'media/blog/uploads/2023/02/26082553/Paperback-%E2%80%93-Picture-Book.jpg',
    cleanKey: 'media/blog/uploads/2023/02/26082553/Paperback-Picture-Book.jpg',
    postId: 'post-regalos-preschool-graduacion',
  },
  {
    rawKey: 'media/blog/uploads/2023/04/09051243/I-have-a-Guardian-Angel-Keychain%EF%BB%BF.png',
    cleanKey: 'media/blog/uploads/2023/04/09051243/I-have-a-Guardian-Angel-Keychain.png',
    postId: 'post-regalos-memorial-gift-loss-mother',
  },
  {
    rawKey: 'media/blog/uploads/2023/03/30035650/Aquabeads-Super-Mario%E2%84%A2-Creation-Cube.jpg',
    cleanKey: 'media/blog/uploads/2023/03/30035650/Aquabeads-Super-Mario-Creation-Cube.jpg',
    postId: 'post-regalos-super-mario',
  },
  {
    rawKey: 'media/blog/uploads/2023/05/21171915/BBQ-Premium%E2%80%8E-Wood-Smoking-Chips.jpg',
    cleanKey: 'media/blog/uploads/2023/05/21171915/BBQ-Premium-Wood-Smoking-Chips.jpg',
    postId: 'post-regalos-meat-lovers',
  },
];

async function fixR2Items() {
  console.log('--- RE-UPLOADING 7 R2 ITEMS WITH CLEAN KEYS ---');
  for (const item of SPECIAL_ITEMS) {
    try {
      const getRes = await s3.send(new GetObjectCommand({
        Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
        Key: item.rawKey,
      }));
      const buf = await streamToBuffer(getRes.Body);
      console.log(`✓ Read "${item.rawKey}" (${buf.length} bytes)`);

      await s3.send(new PutObjectCommand({
        Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
        Key: item.cleanKey,
        Body: buf,
        ContentType: getRes.ContentType || 'image/jpeg',
      }));
      console.log(`  -> Uploaded to clean key: "${item.cleanKey}"`);

      // Test fetch
      const testUrl = `https://media.miregalo.us/${item.cleanKey}`;
      const res = await fetch(testUrl);
      console.log(`  -> Verified URL: ${testUrl} -> HTTP ${res.status}`);

      // Cập nhật post trong Supabase nếu có postId
      if (item.postId) {
        const { data: post } = await sb.from('posts').select('id, items').eq('id', item.postId).single();
        if (post && Array.isArray(post.items)) {
          let updated = false;
          post.items.forEach(it => {
            const currentImg = it.image || it.image_url;
            if (currentImg && currentImg.includes(item.rawKey.split('/').pop())) {
              it.image = testUrl;
              it.image_url = testUrl;
              updated = true;
            }
          });
          if (updated) {
            await sb.from('posts').update({ items: post.items }).eq('id', item.postId);
            console.log(`  -> Cập nhật Supabase post ${item.postId} thành công!`);
          }
        }
      }
    } catch (e) {
      console.error(`❌ Lỗi xử lý ${item.rawKey}:`, e.message);
    }
  }
}

fixR2Items().catch(console.error);
