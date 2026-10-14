import fs from 'fs';
import pngToIcoModule from 'png-to-ico';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const pngToIco = pngToIcoModule.default || pngToIcoModule;

async function main() {
  console.log('=== GENERATING AND SYNCING ALL FAVICONS ===');

  const sourceIcon = 'public/images/miregalo-icon.png';
  if (!fs.existsSync(sourceIcon)) {
    throw new Error(`Source icon not found: ${sourceIcon}`);
  }

  // 1. Generate valid multi-size .ico
  console.log('Generating valid multi-resolution favicon.ico...');
  const icoBuf = await pngToIco(sourceIcon);
  fs.writeFileSync('public/favicon.ico', icoBuf);
  fs.writeFileSync('app/favicon.ico', icoBuf);
  console.log(`✓ Generated public/favicon.ico and app/favicon.ico (${icoBuf.length} bytes, magic: ${icoBuf.slice(0, 4).toString('hex')})`);

  // 2. Sync PNG icons
  const pngBuf = fs.readFileSync(sourceIcon);
  fs.writeFileSync('public/favicon.png', pngBuf);
  fs.writeFileSync('public/apple-touch-icon.png', pngBuf);
  fs.writeFileSync('app/icon.png', pngBuf);
  fs.writeFileSync('app/apple-icon.png', pngBuf);
  console.log('✓ Synced public/favicon.png, public/apple-touch-icon.png, app/icon.png, app/apple-icon.png');

  // 3. Sync to Cloudflare R2
  const envFile = fs.readFileSync('.env.local', 'utf-8');
  const env = {};
  envFile.split('\n').forEach((line) => {
    const [k, ...v] = line.trim().split('=');
    if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
  });

  if (env.CLOUDFLARE_R2_ACCOUNT_ID) {
    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID,
        secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      },
    });

    await s3.send(new PutObjectCommand({
      Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: 'media/images/favicon.ico',
      Body: icoBuf,
      ContentType: 'image/x-icon',
      CacheControl: 'public, max-age=86400',
    }));

    await s3.send(new PutObjectCommand({
      Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: 'media/images/favicon.png',
      Body: pngBuf,
      ContentType: 'image/png',
      CacheControl: 'public, max-age=86400',
    }));

    console.log('✓ Uploaded new favicon.ico and favicon.png to Cloudflare R2 bucket!');
  }

  // Clean scratch files if any
  ['scratch_old_favicon.ico', 'scratch_original_loveable_logo.png', 'scratch_favicon_969.png'].forEach(f => {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  });

  console.log('🎉 ALL FAVICON FILES ARE 100% MIREGALO BRANDED!');
}

main().catch(console.error);
