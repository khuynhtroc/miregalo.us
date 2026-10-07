import fs from 'fs';
import path from 'path';
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

async function uploadToR2(r2Key, buffer, mimeType) {
  await s3.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: r2Key,
    Body: buffer,
    ContentType: mimeType,
    CacheControl: 'public, max-age=31536000, immutable',
  }));
  return `${publicDomain}/${r2Key}`;
}

async function run() {
  console.log('Fixing final remnants...');

  // 1. Fix regalos-summer item image (Set of 4 Luxury Aromatherapy Shower Steamers)
  const { data: postSummer } = await supabase
    .from('posts')
    .select('id, slug, items')
    .eq('slug', 'regalos-summer')
    .single();

  if (postSummer && Array.isArray(postSummer.items)) {
    console.log('Fetching high quality shower steamers image for regalos-summer...');
    const steamerRes = await fetch('https://images.unsplash.com/photo-1608248597359-545a9994c502?w=800&q=80');
    if (steamerRes.ok) {
      const buf = Buffer.from(await steamerRes.arrayBuffer());
      const r2Url = await uploadToR2('media/ai-items/aromatherapy-shower-steamers.jpg', buf, 'image/jpeg');
      const updatedItems = postSummer.items.map(it => {
        if (it.image && it.image.includes('loveable.ai')) {
          return { ...it, image: r2Url };
        }
        return it;
      });
      await supabase.from('posts').update({ items: updatedItems }).eq('id', postSummer.id);
      console.log('✅ Updated regalos-summer item image to:', r2Url);
    }
  }

  // 2. Fix regalos-para-math-teachers item text
  const { data: postMath } = await supabase
    .from('posts')
    .select('id, slug, items')
    .eq('slug', 'regalos-para-math-teachers')
    .single();

  if (postMath && Array.isArray(postMath.items)) {
    const updatedItems = postMath.items.map(it => {
      let str = JSON.stringify(it);
      str = str.replace(/https?:\/\/blog\.loveable\.us\/gifts-librarians\/\)\*\*/g, '/regalos-librarians/');
      return JSON.parse(str);
    });
    await supabase.from('posts').update({ items: updatedItems }).eq('id', postMath.id);
    console.log('✅ Updated regalos-para-math-teachers items');
  }

  // 3. Fix regalos-attachment-parenting content_html
  const { data: postAttach } = await supabase
    .from('posts')
    .select('id, slug, content_html')
    .eq('slug', 'regalos-attachment-parenting')
    .single();

  if (postAttach && postAttach.content_html) {
    const newHtml = postAttach.content_html.replace(/https?:\/\/blog\.loveable\.us\/?/g, '/');
    await supabase.from('posts').update({ content_html: newHtml }).eq('id', postAttach.id);
    console.log('✅ Updated regalos-attachment-parenting content_html');
  }

  // 4. Delete/unpublish the obsolete old loveable announcement post
  const { error: delErr } = await supabase
    .from('posts')
    .delete()
    .eq('slug', 'regalos-loveable-new-journey-announcement');

  if (!delErr) {
    console.log('✅ Removed obsolete regalos-loveable-new-journey-announcement post');
  }

  console.log('\nDone with all final remnant fixes!');
}

run();
