import fs from 'fs';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const accountId = env.CLOUDFLARE_R2_ACCOUNT_ID;
const accessKeyId = env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucketName = env.CLOUDFLARE_R2_BUCKET_NAME;
const publicDomain = (env.CLOUDFLARE_R2_PUBLIC_DOMAIN || 'https://media.miregalo.us').replace(/\/+$/, '');

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

async function run() {
  const { data: postSummer } = await supabase
    .from('posts')
    .select('id, slug, items')
    .eq('slug', 'regalos-summer')
    .single();

  const steamerRes = await fetch('https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80');
  console.log('Unsplash status:', steamerRes.status);
  if (steamerRes.ok) {
    const buf = Buffer.from(await steamerRes.arrayBuffer());
    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: 'media/ai-items/aromatherapy-shower-steamers.jpg',
      Body: buf,
      ContentType: 'image/jpeg',
      CacheControl: 'public, max-age=31536000, immutable',
    }));
    const r2Url = `${publicDomain}/media/ai-items/aromatherapy-shower-steamers.jpg`;
    const updatedItems = postSummer.items.map(it => {
      if (it.image && it.image.includes('loveable')) {
        return { ...it, image: r2Url };
      }
      return it;
    });
    await supabase.from('posts').update({ items: updatedItems }).eq('id', postSummer.id);
    console.log('✅ Updated regalos-summer item image to:', r2Url);
  }
}

run();
