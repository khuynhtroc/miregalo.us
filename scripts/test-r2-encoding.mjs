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

async function main() {
  const variations = [
    'media/blog/uploads/2023/09/06150835/8.-Christmas-Food-%E2%80%93-Comida-de-Navidad-960x686.jpg',
    'media/blog/uploads/2023/09/06150835/8.-Christmas-Food-–-Comida-de-Navidad-960x686.jpg',
    decodeURIComponent('media/blog/uploads/2023/09/06150835/8.-Christmas-Food-%E2%80%93-Comida-de-Navidad-960x686.jpg'),
  ];

  for (const k of variations) {
    try {
      const res = await s3.send(new HeadObjectCommand({ Bucket: env.CLOUDFLARE_R2_BUCKET_NAME, Key: k }));
      console.log(`[FOUND in R2] "${k}" -> Size: ${res.ContentLength}`);
    } catch (e) {
      console.log(`[NOT in R2] "${k}" -> ${e.name}`);
    }
  }

  // Thử test cả URL
  const urls = [
    'https://media.miregalo.us/media/blog/uploads/2023/09/06150835/8.-Christmas-Food-%E2%80%93-Comida-de-Navidad-960x686.jpg',
    'https://media.miregalo.us/media/blog/uploads/2023/09/06150835/8.-Christmas-Food-–-Comida-de-Navidad-960x686.jpg',
  ];
  for (const u of urls) {
    const res = await fetch(u);
    console.log(`Fetch URL: "${u}" -> HTTP ${res.status}`);
  }
}

main().catch(console.error);
