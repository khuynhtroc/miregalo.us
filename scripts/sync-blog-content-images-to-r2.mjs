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

const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID || env.CLOUDFLARE_R2_ACCOUNT_ID;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || env.CLOUDFLARE_R2_BUCKET_NAME;
const publicDomain = (process.env.CLOUDFLARE_R2_PUBLIC_DOMAIN || env.CLOUDFLARE_R2_PUBLIC_DOMAIN || 'https://media.miregalo.us').replace(/\/+$/, '');

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const CONCURRENCY = 15;

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

function getR2KeyFromUrl(urlStr, postSlug = 'article') {
  try {
    const parsed = new URL(urlStr);
    if (parsed.hostname.includes('loveable.appspot.com') || parsed.pathname.includes('loveable.appspot.com')) {
      const cleanPath = parsed.pathname.replace(/^\/+/, '').replace(/^loveable\.appspot\.com\/+/, '');
      return `media/${cleanPath}`;
    }
    const cleanFilename = path.basename(parsed.pathname) || 'image.jpg';
    return `media/blog/${postSlug}-${cleanFilename}`;
  } catch {
    const filename = path.basename(urlStr) || 'image.jpg';
    return `media/blog/${postSlug}-${filename}`;
  }
}

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
  console.log('🚀 CLOUDFLARE R2 BLOG CONTENT IMAGES MIGRATOR');
  console.log('====================================================\n');

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  const listRes = await s3.send(new ListObjectsV2Command({ Bucket: bucketName, MaxKeys: 1 }));
  console.log(`✅ Connected to Cloudflare R2 bucket "${bucketName}"\n`);

  // 1. Fetch all posts from Supabase
  console.log('Fetching all posts from Supabase...');
  let allPosts = [];
  let from = 0;
  const batchSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('posts')
      .select('id, slug, content_html')
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
  console.log(`Loaded ${allPosts.length} posts from Supabase.\n`);

  // 2. Identify posts with embedded images not yet on media.miregalo.us
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  const postsToProcess = allPosts.filter((p) => {
    if (!p.content_html) return false;
    let match;
    const regex = /<img[^>]+src=["']([^"']+)["']/gi;
    while ((match = regex.exec(p.content_html)) !== null) {
      const src = match[1];
      if (src && !src.includes(publicDomain)) {
        return true;
      }
    }
    return false;
  });

  console.log(`Found ${postsToProcess.length} blog posts with embedded images to migrate to R2...\n`);

  let postsUpdated = 0;
  let totalImagesMigrated = 0;
  let totalImagesFailed = 0;
  const startTime = Date.now();

  await runConcurrent(postsToProcess, async (post) => {
    let html = post.content_html;
    let modified = false;

    // Extract all unique img src URLs in this post
    const postImgUrls = new Set();
    let m;
    const postRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    while ((m = postRegex.exec(post.content_html)) !== null) {
      const src = m[1];
      if (src && !src.includes(publicDomain) && src.startsWith('http')) {
        postImgUrls.add(src);
      }
    }

    if (postImgUrls.size === 0) return;

    // Process all images in this post in parallel
    const replacements = new Map();
    await Promise.all(
      Array.from(postImgUrls).map(async (src) => {
        const r2Key = getR2KeyFromUrl(src, post.slug);
        const newCdnUrl = `${publicDomain}/${r2Key}`;

        try {
          if (!uploadedKeys.has(r2Key)) {
            const res = await fetch(src);
            if (res.ok) {
              const arrayBuf = await res.arrayBuffer();
              const buf = Buffer.from(arrayBuf);
              const mime = res.headers.get('content-type') || getMimeType(r2Key);
              await uploadToR2(s3, r2Key, buf, mime);
              replacements.set(src, newCdnUrl);
              totalImagesMigrated++;
            } else {
              totalImagesFailed++;
            }
          } else {
            replacements.set(src, newCdnUrl);
            totalImagesMigrated++;
          }
        } catch {
          totalImagesFailed++;
        }
      })
    );

    // Replace URLs in HTML
    for (const [oldUrl, newUrl] of replacements.entries()) {
      if (html.includes(oldUrl)) {
        html = html.split(oldUrl).join(newUrl);
        modified = true;
      }
    }

    if (modified) {
      await supabase
        .from('posts')
        .update({ content_html: html, updated_at: new Date().toISOString() })
        .eq('id', post.id);

      postsUpdated++;
      if (postsUpdated % 25 === 0 || postsUpdated === postsToProcess.length) {
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = (totalImagesMigrated / elapsed).toFixed(1);
        console.log(`  [Blog Content] Migrated ${postsUpdated}/${postsToProcess.length} posts (${totalImagesMigrated} images, ${speed} img/sec)...`);
      }
    }
  }, CONCURRENCY);

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n====================================================');
  console.log('🎉 BLOG CONTENT IMAGES MIGRATION COMPLETE!');
  console.log(`  Posts Updated:             ${postsUpdated} / ${postsToProcess.length}`);
  console.log(`  Embedded Images Migrated:  ${totalImagesMigrated}`);
  console.log(`  Images Failed / Skipped:   ${totalImagesFailed}`);
  console.log(`  Time Elapsed:              ${totalElapsed}s`);
  console.log(`  CDN Domain:                ${publicDomain}`);
  console.log('====================================================\n');
}

run().catch((err) => {
  console.error('Fatal content sync error:', err);
  process.exit(1);
});
