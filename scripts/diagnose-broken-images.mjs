import fs from 'fs';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

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

async function main() {
  console.log('Loading all R2 keys...');
  const allR2Keys = [];
  let token = undefined;
  do {
    const res = await s3.send(new ListObjectsV2Command({
      Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
      ContinuationToken: token,
      MaxKeys: 1000,
    }));
    if (res.Contents) {
      for (const c of res.Contents) {
        if (c.Key) allR2Keys.push(c.Key);
      }
    }
    token = res.NextContinuationToken;
  } while (token);

  console.log(`Loaded ${allR2Keys.length} keys from R2.`);

  // 1. Kiểm tra các item lỗi
  const testItems = [
    'Mr.-Wattson',
    'Screenshot-2024-03-11',
    'Customized-Teacher-Life',
    'Shes-Birdie',
    'Paperback',
    'Guardian-Angel-Keychain',
    'Super-Mario',
    'BBQ-Premium',
    'Set-of-4-Luxury-Aromatherapy',
  ];

  console.log('\n--- TÌM KIẾM CÁC ITEM BỊ LỖI TRONG R2 ---');
  for (const term of testItems) {
    const matches = allR2Keys.filter(k => k.toLowerCase().includes(term.toLowerCase()));
    console.log(`Tìm "${term}":`, matches);
  }

  // 2. Tìm kiếm ảnh Halloween có sẵn trong R2
  console.log('\n--- TÌM KIẾM ẢNH HALLOWEEN CÓ SẴN TRONG R2 ---');
  const halloweenKeys = allR2Keys.filter(k => k.toLowerCase().includes('halloween'));
  console.log(`Tổng số ảnh Halloween có trong R2: ${halloweenKeys.length}`);
  console.log('Sample 15 ảnh Halloween:', halloweenKeys.slice(0, 15));

  // 3. Tìm kiếm ảnh Heroes có sẵn trong R2
  console.log('\n--- TÌM KIẾM ẢNH HEROES TRONG R2 ---');
  const heroKeys = allR2Keys.filter(k => k.toLowerCase().includes('hero') || k.toLowerCase().includes('portada'));
  console.log(`Tổng số ảnh Hero/Portada: ${heroKeys.length}`);
  console.log('Sample 15 ảnh Hero:', heroKeys.slice(0, 15));

  // 4. Kiểm tra xem trong 299 ảnh R2 bị 404 trong content_html có phải do space hoặc URL encode không
  const report = JSON.parse(fs.readFileSync('scripts/broken-images-report.json', 'utf-8'));
  const r2Errors = report.brokenImages.filter(b => b.url.includes('media.miregalo.us'));
  console.log(`\n--- PHÂN TÍCH ${r2Errors.length} ẢNH R2 BỊ 404 TRONG CONTENT_HTML ---`);
  
  let spaceFixedCount = 0;
  let decodedFixedCount = 0;
  for (const err of r2Errors.slice(0, 50)) {
    const rawKey = err.url.replace('https://media.miregalo.us/', '');
    const cleanKey = decodeURIComponent(rawKey).replace(/\s+/g, '-').replace(/^media\//, 'media/');
    // Thử tìm matches
    const baseName = rawKey.split('/').pop();
    const cleanBaseName = decodeURIComponent(baseName).trim();
    const found = allR2Keys.filter(k => k.toLowerCase().includes(cleanBaseName.toLowerCase().slice(0, 15)));
    if (found.length > 0) {
      console.log(`URL lỗi: ${err.url}\n  -> Khớp trong R2: ${found[0]}`);
    }
  }

  // 5. Kiểm tra 1,095 ảnh googleusercontent
  console.log('\n--- PHÂN TÍCH ẢNH GOOGLEUSERCONTENT ---');
  const googleErrors = report.brokenImages.filter(b => b.url.startsWith('https://lh'));
  const postsWithGoogleImages = new Set();
  googleErrors.forEach(b => {
    b.occurrences.forEach(o => postsWithGoogleImages.add(o.slug));
  });
  console.log(`Số ảnh Google lỗi: ${googleErrors.length} nằm trong ${postsWithGoogleImages.size} bài viết.`);
  console.log('Sample bài viết chứa ảnh Google lỗi:', Array.from(postsWithGoogleImages).slice(0, 10));
}

main().catch(console.error);
