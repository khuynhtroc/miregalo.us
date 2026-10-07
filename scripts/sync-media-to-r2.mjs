import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
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
const publicDomain = (args['domain'] || process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN || env.CLOUDFLARE_R2_PUBLIC_DOMAIN || env.R2_PUBLIC_DOMAIN || 'https://media.miregalo.us').replace(/\/+$/, '');

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const CONCURRENCY = parseInt(args['concurrency'] || '20', 10);
const PHASE = args['phase'] || 'all'; // 'all' | 'hero' | 'items' | 'local'

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

function getR2KeyFromUrl(urlStr) {
  try {
    const parsed = new URL(urlStr);
    const cleanPath = parsed.pathname.replace(/^\/+/, '').replace(/^loveable\.appspot\.com\/+/, '');
    return `media/${cleanPath}`;
  } catch {
    const filename = path.basename(urlStr);
    return `media/${filename}`;
  }
}

// Track uploaded R2 keys to prevent redundant operations
const uploadedKeys = new Set();

async function uploadToR2(s3, r2Key, buffer, contentType) {
  if (uploadedKeys.has(r2Key)) return true;
  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: r2Key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );
  uploadedKeys.add(r2Key);
  return true;
}

// Helper to run tasks concurrently
async function runConcurrent(items, fn, concurrency = CONCURRENCY) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(concurrency, items.length || 1) }).map(async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      await fn(item);
    }
  });
  await Promise.all(workers);
}

async function run() {
  console.log('====================================================');
  console.log('🚀 CLOUDFLARE R2 FULL MEDIA SYNCHRONIZER (Miregalo)');
  console.log('====================================================\n');

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    console.error('❌ Missing Cloudflare R2 Credentials in environment or arguments!\n');
    process.exit(1);
  }

  console.log(`Cloudflare Account ID: ${accountId}`);
  console.log(`R2 Bucket Name:        ${bucketName}`);
  console.log(`Public CDN Domain:     ${publicDomain}`);
  console.log(`Workers Concurrency:   ${CONCURRENCY}`);
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
    const listRes = await s3.send(new ListObjectsV2Command({ Bucket: bucketName, MaxKeys: 5 }));
    console.log(`✅ Successfully authenticated to R2 bucket "${bucketName}"! Existing keys: ${listRes.KeyCount ?? 0}\n`);
  } catch (err) {
    console.error(`❌ Connection test failed: ${err.message}`);
    process.exit(1);
  }

  // ----------------------------------------------------
  // STEP 1: Sync Local Brand Assets
  // ----------------------------------------------------
  let localSynced = 0;
  if (PHASE === 'all' || PHASE === 'local' || PHASE === 'hero') {
    console.log('--- Step 1: Syncing Local Brand Assets (Logos, Icons, Favicons) ---');
    const localFiles = [
      { file: 'public/images/miregalo-logo.png', r2Key: 'media/images/miregalo-logo.png' },
      { file: 'public/images/miregalo-logo-fullsize.png', r2Key: 'media/images/miregalo-logo-fullsize.png' },
      { file: 'public/images/miregalo-icon.png', r2Key: 'media/images/miregalo-icon.png' },
      { file: 'public/images/loveable-logo.png', r2Key: 'media/images/loveable-logo.png' },
      { file: 'public/images/loveable-logo-fullsize.png', r2Key: 'media/images/loveable-logo-fullsize.png' },
      { file: 'public/favicon.ico', r2Key: 'media/images/favicon.ico' },
      { file: 'public/favicon.png', r2Key: 'media/images/favicon.png' },
      { file: 'public/apple-touch-icon.png', r2Key: 'media/images/apple-touch-icon.png' },
    ];

  // Also check public/uploads if any
  if (fs.existsSync('public/uploads')) {
    const uploadFiles = fs.readdirSync('public/uploads');
    for (const f of uploadFiles) {
      const full = path.join('public/uploads', f);
      if (fs.statSync(full).isFile()) {
        localFiles.push({ file: full, r2Key: `media/uploads/${f}` });
      }
    }
  }

  let localSynced = 0;
  for (const item of localFiles) {
    if (!fs.existsSync(item.file)) continue;
    try {
      const buf = fs.readFileSync(item.file);
      const mime = getMimeType(item.file);
      await uploadToR2(s3, item.r2Key, buf, mime);
      const cdnUrl = `${publicDomain}/${item.r2Key}`;
      console.log(`  ✓ Synced ${item.file} -> ${cdnUrl}`);
      localSynced++;
    } catch (err) {
      console.warn(`  ⚠️ Failed ${item.file}: ${err.message}`);
    }
  }
  console.log(`Step 1 Complete: ${localSynced} local assets synchronized to R2!\n`);
  }

  // ----------------------------------------------------
  // STEP 2: Fetch All Posts from Supabase
  // ----------------------------------------------------
  console.log('--- Step 2: Fetching All Posts from Supabase ---');
  let allPosts = [];
  let from = 0;
  const batchSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('posts')
      .select('id, slug, hero_image, items')
      .range(from, from + batchSize - 1);
    if (error) {
      console.error('Error fetching posts:', error);
      break;
    }
    if (!data || data.length === 0) break;
    allPosts.push(...data);
    from += batchSize;
    if (data.length < batchSize) break;
  }
  console.log(`Loaded ${allPosts.length} posts from database.\n`);

  // ----------------------------------------------------
  // STEP 3: Sync Article Hero Images
  // ----------------------------------------------------
  let heroCount = 0;
  let heroFailed = 0;
  if (PHASE === 'all' || PHASE === 'hero') {
    console.log('--- Step 3: Migrating Article Hero Images to Cloudflare R2 ---');
    const postsNeedingHero = allPosts.filter(
      (p) => p.hero_image && p.hero_image.startsWith('http') && !p.hero_image.includes(publicDomain)
    );
    console.log(`Found ${postsNeedingHero.length} posts with hero images to migrate...`);

    const startTimeHero = Date.now();

    await runConcurrent(postsNeedingHero, async (post) => {
      try {
        const r2Key = getR2KeyFromUrl(post.hero_image);
        const newCdnUrl = `${publicDomain}/${r2Key}`;

        // Download from original source
        const res = await fetch(post.hero_image);
        if (res.ok) {
          const arrayBuf = await res.arrayBuffer();
          const buf = Buffer.from(arrayBuf);
          const mime = res.headers.get('content-type') || getMimeType(r2Key);
          await uploadToR2(s3, r2Key, buf, mime);

          // Update post in Supabase
          await supabase
            .from('posts')
            .update({ hero_image: newCdnUrl, updated_at: new Date().toISOString() })
            .eq('id', post.id);

          heroCount++;
          if (heroCount % 50 === 0 || heroCount === postsNeedingHero.length) {
            const speed = (heroCount / ((Date.now() - startTimeHero) / 1000)).toFixed(1);
            console.log(`  [Hero] Synced ${heroCount}/${postsNeedingHero.length} images (${speed} img/sec)...`);
          }
        } else {
          heroFailed++;
        }
      } catch (err) {
        heroFailed++;
      }
    });

    const heroElapsed = ((Date.now() - startTimeHero) / 1000).toFixed(1);
    console.log(`Step 3 Complete: ${heroCount} hero images migrated in ${heroElapsed}s (${heroFailed} failed)!\n`);
  }

  // ----------------------------------------------------
  // STEP 4: Sync Post Item Images (Product Items)
  // ----------------------------------------------------
  let postsItemUpdated = 0;
  let totalItemImagesSynced = 0;
  if (PHASE === 'all' || PHASE === 'items') {
    console.log('--- Step 4: Migrating Item Images to Cloudflare R2 ---');
    const postsWithItems = allPosts.filter(
      (p) => Array.isArray(p.items) && p.items.some((it) => it?.image && it.image.startsWith('http') && !it.image.includes(publicDomain))
    );
    console.log(`Found ${postsWithItems.length} posts with item images to migrate...`);

  let postsItemUpdated = 0;
  let totalItemImagesSynced = 0;
  const startTimeItems = Date.now();

  await runConcurrent(postsWithItems, async (post) => {
    let changed = false;
    const items = [...post.items];

    await Promise.all(
      items.map(async (it) => {
        if (!it?.image || !it.image.startsWith('http') || it.image.includes(publicDomain)) {
          return;
        }

        const r2Key = getR2KeyFromUrl(it.image);
        const newCdnUrl = `${publicDomain}/${r2Key}`;

        try {
          if (!uploadedKeys.has(r2Key)) {
            const res = await fetch(it.image);
            if (res.ok) {
              const arrayBuf = await res.arrayBuffer();
              const buf = Buffer.from(arrayBuf);
              const mime = res.headers.get('content-type') || getMimeType(r2Key);
              await uploadToR2(s3, r2Key, buf, mime);
              it.image = newCdnUrl;
              changed = true;
              totalItemImagesSynced++;
            }
          } else {
            it.image = newCdnUrl;
            changed = true;
            totalItemImagesSynced++;
          }
        } catch {
          // Keep original if failed
        }
      })
    );

    if (changed) {
      await supabase
        .from('posts')
        .update({ items, updated_at: new Date().toISOString() })
        .eq('id', post.id);

      postsItemUpdated++;
      if (postsItemUpdated % 25 === 0 || postsItemUpdated === postsWithItems.length) {
        const speed = (totalItemImagesSynced / ((Date.now() - startTimeItems) / 1000)).toFixed(1);
        console.log(`  [Items] Updated ${postsItemUpdated}/${postsWithItems.length} posts (${totalItemImagesSynced} item images, ${speed} img/sec)...`);
      }
    }
  }, 10); // 10 concurrent posts for items migration

    const itemsElapsed = ((Date.now() - startTimeItems) / 1000).toFixed(1);
    console.log(`Step 4 Complete: ${postsItemUpdated} posts updated with ${totalItemImagesSynced} item images in ${itemsElapsed}s!\n`);
  }

  // ----------------------------------------------------
  // STEP 5: Update Supabase Storage Settings
  // ----------------------------------------------------
  console.log('--- Step 5: Updating Supabase Storage Settings Timestamp ---');
  await supabase
    .from('storage_settings')
    .upsert({
      id: 'storage-settings-main',
      provider: 'cloudflare_r2',
      cloudflare: {
        account_id: accountId,
        access_key_id: accessKeyId,
        secret_access_key: secretAccessKey,
        bucket_name: bucketName,
        public_domain: publicDomain,
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      },
      auto_sync: true,
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  console.log('✅ Storage settings recorded in Supabase!\n');

  console.log('====================================================');
  console.log('🎉 ALL MEDIA SYNCHRONIZATION COMPLETED SUCCESSFULLY!');
  console.log(`  Local Assets Synced:        ${localSynced}`);
  console.log(`  Hero Images Migrated:       ${heroCount}`);
  console.log(`  Product Item Images Synced: ${totalItemImagesSynced}`);
  console.log(`  Public CDN Host:            ${publicDomain}`);
  console.log('====================================================\n');
}

run().catch((err) => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
