import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
const envFile = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf-8') : '';
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

// Parse command line arguments if provided
const args = process.argv.slice(2).reduce((acc, cur) => {
  const [k, v] = cur.split('=');
  if (k.startsWith('--') && v) acc[k.slice(2)] = v;
  return acc;
}, {});

const accountId = args['account-id'] || process.env.CLOUDFLARE_R2_ACCOUNT_ID || env.CLOUDFLARE_R2_ACCOUNT_ID || env.R2_ACCOUNT_ID;
const accessKeyId = args['access-key'] || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || env.CLOUDFLARE_R2_ACCESS_KEY_ID || env.R2_ACCESS_KEY_ID;
const secretAccessKey = args['secret-key'] || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || env.R2_SECRET_ACCESS_KEY;
const bucketName = args['bucket'] || process.env.CLOUDFLARE_R2_BUCKET_NAME || env.CLOUDFLARE_R2_BUCKET_NAME || env.R2_BUCKET_NAME;
const publicDomain = (args['domain'] || process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN || env.CLOUDFLARE_R2_PUBLIC_DOMAIN || env.R2_PUBLIC_DOMAIN || '').replace(/\/+$/, '');

const supabaseUrl = env.SUPABASE_URL || 'https://tvgipyhvvtovgttnyivw.supabase.co';
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.webp': return 'image/webp';
    case '.svg': return 'image/svg+xml';
    case '.gif': return 'image/gif';
    case '.ico': return 'image/x-icon';
    default: return 'application/octet-stream';
  }
}

async function run() {
  console.log('====================================================');
  console.log('🚀 CLOUDFLARE R2 MEDIA SYNCHRONIZER');
  console.log('====================================================\n');

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    console.error('❌ Missing Cloudflare R2 Credentials!\n');
    console.log('Please provide them via command-line flags or in .env.local:');
    console.log('  CLOUDFLARE_R2_ACCOUNT_ID=<Your Cloudflare Account ID>');
    console.log('  CLOUDFLARE_R2_ACCESS_KEY_ID=<Your R2 Access Key ID>');
    console.log('  CLOUDFLARE_R2_SECRET_ACCESS_KEY=<Your R2 Secret Access Key>');
    console.log('  CLOUDFLARE_R2_BUCKET_NAME=<Your R2 Bucket Name>');
    console.log('  CLOUDFLARE_R2_PUBLIC_DOMAIN=<Your Public Domain or r2.dev URL>\n');
    console.log('Example:');
    console.log('  node scripts/sync-media-to-r2.mjs --account-id=abc123 --access-key=xyz --secret-key=secret --bucket=miregalo-media --domain=https://cdn.miregalo.us');
    process.exit(1);
  }

  console.log(`Cloudflare Account ID: ${accountId}`);
  console.log(`R2 Bucket Name:        ${bucketName}`);
  console.log(`Public Domain / CDN:   ${publicDomain || '(R2 Direct S3 URL)'}`);
  console.log(`Testing connection to Cloudflare R2...\n`);

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  try {
    const listRes = await s3.send(new ListObjectsV2Command({ Bucket: bucketName, MaxKeys: 1 }));
    console.log(`✅ Successfully authenticated and connected to R2 bucket "${bucketName}"! Existing keys: ${listRes.KeyCount ?? 0}\n`);
  } catch (err) {
    console.error(`❌ Connection test failed: ${err.message}`);
    process.exit(1);
  }

  // 1. Sync Local Brand Assets
  console.log('--- Step 1: Syncing Local Brand Assets (public/images/*) ---');
  const localDirs = [
    { dir: 'public/images', prefix: 'images' },
    { dir: 'public/uploads', prefix: 'uploads' },
  ];

  let localSynced = 0;
  for (const { dir, prefix } of localDirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (!stat.isFile()) continue;

      const r2Key = `media/${prefix}/${file}`;
      const buffer = fs.readFileSync(fullPath);
      const mime = getMimeType(file);

      try {
        await s3.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: r2Key,
            Body: buffer,
            ContentType: mime,
            CacheControl: 'public, max-age=31536000, immutable',
          })
        );
        const cdnUrl = publicDomain ? `${publicDomain}/${r2Key}` : `https://${bucketName}.r2.cloudflarestorage.com/${r2Key}`;
        console.log(`  ✓ Uploaded ${file} -> ${cdnUrl}`);
        localSynced++;
      } catch (e) {
        console.warn(`  ⚠️ Failed to upload ${file}: ${e.message}`);
      }
    }
  }
  console.log(`Step 1 Complete: ${localSynced} local assets synchronized!\n`);

  // 2. Sync Article Hero Images from Google Cloud Storage
  console.log('--- Step 2: Syncing Article Images to Cloudflare R2 ---');
  const { data: posts, error: pErr } = await supabase
    .from('posts')
    .select('id,slug,hero_image')
    .limit(5000);

  if (pErr) {
    console.error(`Failed to fetch posts: ${pErr.message}`);
    return;
  }

  console.log(`Found ${posts.length} articles to check...`);
  let heroSynced = 0;
  let skipped = 0;

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    if (!post.hero_image || !post.hero_image.startsWith('http')) {
      skipped++;
      continue;
    }

    if (publicDomain && post.hero_image.startsWith(publicDomain)) {
      skipped++;
      continue;
    }

    try {
      const parsedUrl = new URL(post.hero_image);
      const filename = path.basename(parsedUrl.pathname);
      const r2Key = `media/posts/hero-${post.slug}-${filename}`;

      // Download
      const imgRes = await fetch(post.hero_image);
      if (imgRes.ok) {
        const arrayBuf = await imgRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        const mime = imgRes.headers.get('content-type') || getMimeType(filename);

        await s3.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: r2Key,
            Body: buffer,
            ContentType: mime,
            CacheControl: 'public, max-age=31536000, immutable',
          })
        );

        const newCdnUrl = publicDomain ? `${publicDomain}/${r2Key}` : `https://${bucketName}.r2.cloudflarestorage.com/${r2Key}`;

        // Update post in Supabase
        await supabase
          .from('posts')
          .update({ hero_image: newCdnUrl, updated_at: new Date().toISOString() })
          .eq('id', post.id);

        heroSynced++;
        if (heroSynced % 25 === 0 || i === posts.length - 1) {
          console.log(`  [${i + 1}/${posts.length}] Synced ${heroSynced} hero images to Cloudflare R2...`);
        }
      }
    } catch (err) {
      // Non-fatal, continue with other posts
    }
  }

  console.log(`\n====================================================`);
  console.log(`🎉 ALL MEDIA SYNCHRONIZATION COMPLETE!`);
  console.log(`  Local Brand Assets Synced: ${localSynced}`);
  console.log(`  Article Hero Images Synced: ${heroSynced}`);
  console.log(`  Skipped / Already Synced:   ${skipped}`);
  console.log(`====================================================\n`);
}

run().catch(console.error);
