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
  const testKeys = [
    'media/blog/uploads/2023/08/16104442/Halloween-Party-Name.jpg',
    'media/medium_1_Year_Dating_Anniversary_ccb580c344/medium_1_Year_Dating_Anniversary_ccb580c344.png',
  ];
  for (const key of testKeys) {
    try {
      const res = await s3.send(new HeadObjectCommand({ Bucket: env.CLOUDFLARE_R2_BUCKET_NAME, Key: key }));
      console.log(`[FOUND in R2] ${key} (${res.ContentLength} bytes, ${res.ContentType})`);
    } catch (e) {
      console.log(`[NOT in R2] ${key}: ${e.name}`);
    }
  }
}

main().catch(console.error);
