import sharp from 'sharp';
import fs from 'fs';
import pngToIcoModule from 'png-to-ico';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const pngToIco = pngToIcoModule.default || pngToIcoModule;

async function generate() {
  console.log('=== GENERATING GOOGLE SEARCH COMPLIANT FAVICONS (MULTIPLES OF 48PX) ===');

  const src = 'public/images/miregalo-icon.png';
  if (!fs.existsSync(src)) {
    throw new Error('Source icon not found');
  }

  // 1. Google Search compliant sizes (multiples of 48px square)
  const sizes = [48, 96, 144, 192];
  for (const s of sizes) {
    const filename = `public/favicon-${s}x${s}.png`;
    await sharp(src).resize(s, s).png().toFile(filename);
    console.log(`✓ Generated ${filename} (${s}x${s}px)`);
  }

  // 2. Apple Touch Icon (180x180 standard)
  await sharp(src).resize(180, 180).png().toFile('public/apple-touch-icon.png');
  await sharp(src).resize(180, 180).png().toFile('app/apple-icon.png');
  console.log('✓ Generated apple-touch-icon.png (180x180px)');

  // 3. Multi-resolution ICO (16, 32, 48)
  const p48 = await sharp(src).resize(48, 48).png().toBuffer();
  const icoBuf = await pngToIco(p48);
  fs.writeFileSync('public/favicon.ico', icoBuf);
  fs.writeFileSync('app/favicon.ico', icoBuf);
  console.log('✓ Generated public/favicon.ico and app/favicon.ico (Multi-size ICO with 48px layer)');

  // 4. Default PNG favicon (96x96 for crisp displays)
  await sharp(src).resize(96, 96).png().toFile('public/favicon.png');
  await sharp(src).resize(96, 96).png().toFile('app/icon.png');
  console.log('✓ Generated public/favicon.png and app/icon.png (96x96px)');

  // 5. Upload all to Cloudflare R2
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

    const uploads = [
      { key: 'media/images/favicon.ico', file: 'public/favicon.ico', mime: 'image/x-icon' },
      { key: 'media/images/favicon.png', file: 'public/favicon.png', mime: 'image/png' },
      { key: 'media/images/favicon-48x48.png', file: 'public/favicon-48x48.png', mime: 'image/png' },
      { key: 'media/images/favicon-96x96.png', file: 'public/favicon-96x96.png', mime: 'image/png' },
      { key: 'media/images/favicon-192x192.png', file: 'public/favicon-192x192.png', mime: 'image/png' },
      { key: 'media/images/apple-touch-icon.png', file: 'public/apple-touch-icon.png', mime: 'image/png' },
    ];

    for (const u of uploads) {
      await s3.send(new PutObjectCommand({
        Bucket: env.CLOUDFLARE_R2_BUCKET_NAME,
        Key: u.key,
        Body: fs.readFileSync(u.file),
        ContentType: u.mime,
        CacheControl: 'public, max-age=86400',
      }));
      console.log(`✓ Uploaded ${u.key} to Cloudflare R2`);
    }
  }

  console.log('\n🎉 ALL ICONS SUCCESSFULLY GENERATED & READY FOR GOOGLE SEARCH!');
}

generate().catch(console.error);
