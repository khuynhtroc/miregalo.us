import fs from 'fs';
import { S3Client, CopyObjectCommand } from '@aws-sdk/client-s3';

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
  const srcKey = 'media/blog/uploads/2023/09/06150835/8.-Christmas-Food-%E2%80%93-Comida-de-Navidad-960x686.jpg';
  const dstKey = 'media/blog/uploads/2023/09/06150835/8.-Christmas-Food-–-Comida-de-Navidad-960x686.jpg';

  console.log('Copying object in R2...');
  await s3.send(new CopyObjectCommand({
    Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
    CopySource: `${env.CLOUDFLARE_R2_BUCKET_NAME}/${srcKey}`,
    Key: dstKey,
  }));
  console.log('Copied successfully!');

  // Bây giờ fetch lại URL chuẩn:
  const u = 'https://media.miregalo.us/media/blog/uploads/2023/09/06150835/8.-Christmas-Food-%E2%80%93-Comida-de-Navidad-960x686.jpg';
  const res = await fetch(u);
  console.log('Normal URL status now:', res.status, res.headers.get('content-length'));
}

main().catch(console.error);
