import fs from 'fs';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

const db = JSON.parse(fs.readFileSync('data/db.json', 'utf8'));
const posts = db.posts || [];

function getR2Key(urlStr) {
  try {
    const parsed = new URL(urlStr);
    const cleanPath = parsed.pathname.replace(/^\/+/, '').replace(/^loveable\.appspot\.com\/+/, '');
    return `media/${cleanPath}`;
  } catch {
    return null;
  }
}

async function checkSample() {
  const heroPosts = posts.filter(p => p.hero_image && p.hero_image.includes('loveable'));
  console.log(`Total hero posts with loveable: ${heroPosts.length}`);

  // Check 50 random hero posts
  const sample = heroPosts.slice(0, 50);
  let found = 0;
  let missing = [];

  for (const p of sample) {
    const key = getR2Key(p.hero_image);
    if (!key) continue;
    try {
      await s3.send(new HeadObjectCommand({ Bucket: env.CLOUDFLARE_R2_BUCKET_NAME, Key: key }));
      found++;
    } catch (e) {
      missing.push({ slug: p.slug, image: p.hero_image, key });
    }
  }

  console.log(`Checked 50 sample hero images: Found in R2: ${found}, Missing: ${missing.length}`);
  if (missing.length > 0) {
    console.log('Sample missing:', missing.slice(0, 5));
  }
}

checkSample().catch(console.error);
