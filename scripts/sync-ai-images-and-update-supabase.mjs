import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
const envFile = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf-8') : '';
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID || env.CLOUDFLARE_R2_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || env.CLOUDFLARE_R2_BUCKET_NAME;
const publicDomain = (process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN || env.CLOUDFLARE_R2_PUBLIC_DOMAIN || 'https://media.miregalo.us').replace(/\/+$/, '');

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const artifactDir = 'C:/Users/OK/.gemini/antigravity/brain/380e261e-4afc-43e6-983e-2e7980270fe1';

const heroMappings = [
  { postId: 'post-regalos-animals', slug: 'regalos-animals', file: 'regalos_animals_hero_1791363827442.jpg' },
  { postId: 'post-regalos-aniversario', slug: 'regalos-aniversario', file: 'regalos_aniversario_hero_1791363839291.jpg' },
  { postId: 'post-regalos-anyone', slug: 'regalos-anyone', file: 'regalos_anyone_hero_1791363851085.jpg' },
  { postId: 'post-regalos-author/loveable-content-team', slug: 'regalos-author/loveable-content-team', file: 'loveable_team_hero_1791363863268.jpg' },
  { postId: 'post-regalos-aniversario-deseos-para-amigos', slug: 'regalos-aniversario-deseos-para-amigos', file: 'aniversario_amigos_hero_1791363873939.jpg' },
  { postId: 'post-regalos-cumpleanos', slug: 'regalos-cumpleanos', file: 'regalos_cumpleanos_hero_1791363903574.jpg' },
  { postId: 'post-regalos-beyond-fossils-keeping-the-spark-wonder-alive', slug: 'regalos-beyond-fossils-keeping-the-spark-wonder-alive', file: 'beyond_fossils_hero_1791363917176.jpg' },
  { postId: 'post-regalos-colors-for-cocktail-dresses-2025', slug: 'regalos-colors-for-cocktail-dresses-2025', file: 'cocktail_dresses_hero_1791363927993.jpg' },
  { postId: 'post-regalos-gift-ideas-for-music-lovers', slug: 'regalos-gift-ideas-for-music-lovers', file: 'music_lovers_hero_1791363939656.jpg' },
  { postId: 'post-regalos-digital-regalos-international-women-day', slug: 'regalos-digital-regalos-international-women-day', file: 'women_day_hero_1791363951994.jpg' },
  { postId: 'post-regalos-father-aniversario-death-frases', slug: 'regalos-father-aniversario-death-frases', file: 'memorial_father_hero_1791363990227.jpg' },
  { postId: 'post-regalos-portable-vino-chiller-options', slug: 'regalos-portable-vino-chiller-options', file: 'vino_chiller_hero_1791364002458.jpg' },
  { postId: 'post-regalos-unlock-versatility-acryliic-sign-holders', slug: 'regalos-unlock-versatility-acryliic-sign-holders', file: 'acrylic_sign_holders_hero.jpg' },
  { postId: 'post-regalos-how-business-travelers-benefit-from-esim-in-asia', slug: 'regalos-how-business-travelers-benefit-from-esim-in-asia', file: 'business_esim_asia_hero.jpg' },
  { postId: 'post-regalos-navipapa', slug: 'regalos-navipapa', file: 'regalos_navipapa_hero.jpg' },
  { postId: 'post-regalos-couples', slug: 'regalos-couples', file: 'regalos_couples_hero.jpg' },
  { postId: 'post-regalos-papa', slug: 'regalos-papa', file: 'regalos_papa_hero.jpg' },
  { postId: 'post-regalos-events', slug: 'regalos-events', file: 'regalos_events_hero.jpg' },
  { postId: 'post-regalos-family', slug: 'regalos-family', file: 'regalos_family_hero.jpg' },
  { postId: 'post-regalos-friends', slug: 'regalos-friends', file: 'regalos_friends_hero.jpg' }
];

async function uploadFileToR2(localPath, r2Key) {
  const buffer = fs.readFileSync(localPath);
  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: r2Key,
      Body: buffer,
      ContentType: 'image/jpeg',
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );
  const publicUrl = `${publicDomain}/${r2Key}`;
  console.log(`[R2 Uploaded] ${r2Key} -> ${publicUrl}`);
  return publicUrl;
}

async function run() {
  console.log('=== Uploading 20 Hero Images to Cloudflare R2 & Updating Supabase ===');

  for (const m of heroMappings) {
    const localPath = path.join(artifactDir, m.file);
    if (!fs.existsSync(localPath)) {
      console.error(`ERROR: File not found: ${localPath}`);
      continue;
    }
    const cleanSlug = m.slug.replace(/[^a-zA-Z0-9_-]/g, '-');
    const r2Key = `media/ai-heroes/${cleanSlug}.jpg`;
    const publicUrl = await uploadFileToR2(localPath, r2Key);

    // Update Supabase
    const { data, error } = await supabase
      .from('posts')
      .update({ hero_image: publicUrl })
      .eq('id', m.postId);

    if (error) {
      console.error(`Error updating post ${m.postId}:`, error);
    } else {
      console.log(`[Supabase Updated] ${m.postId} hero_image -> ${publicUrl}`);
    }
  }

  console.log('\n=== Uploading Item #48 (Mr. Wattson Lamp) & Updating Supabase ===');
  const lampLocalPath = path.join(artifactDir, 'mr_wattson_lamp_item.jpg');
  if (fs.existsSync(lampLocalPath)) {
    const lampR2Key = 'media/ai-items/mr-wattson-table-lamp.jpg';
    const lampUrl = await uploadFileToR2(lampLocalPath, lampR2Key);

    // Fetch post-regalos-divertidos-60th-cumpleanos
    const { data: post, error: fetchErr } = await supabase
      .from('posts')
      .select('id, items')
      .eq('id', 'post-regalos-divertidos-60th-cumpleanos')
      .single();

    if (fetchErr) {
      console.error('Error fetching post-regalos-divertidos-60th-cumpleanos:', fetchErr);
    } else if (post && Array.isArray(post.items)) {
      const updatedItems = [...post.items];
      if (updatedItems[48]) {
        console.log(`Old item image: ${updatedItems[48].image}`);
        updatedItems[48].image = lampUrl;
        const { error: updateErr } = await supabase
          .from('posts')
          .update({ items: updatedItems })
          .eq('id', 'post-regalos-divertidos-60th-cumpleanos');
        if (updateErr) {
          console.error('Error updating items:', updateErr);
        } else {
          console.log(`[Supabase Updated] post-regalos-divertidos-60th-cumpleanos Item #48 -> ${lampUrl}`);
        }
      }
    }
  }

  console.log('\n=== Finished uploading & updating hero + item images! ===');
}

run();
