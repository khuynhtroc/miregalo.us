import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

const ARTIFACT_DIR = 'C:\\Users\\OK\\.gemini\\antigravity\\brain\\380e261e-4afc-43e6-983e-2e7980270fe1';
const PUBLIC_HEROES_DIR = path.join(process.cwd(), 'public', 'images', 'heroes');

// Cloudflare R2 Credentials
const accountId = '2e901a592cf5f497b7b446745cce98fd';
const accessKeyId = 'dc17895411931434dc806460b19e7473';
const secretAccessKey = '2d9712bfb69c14de896d456771f0f20bee6047a0f7669f284c7a0d22228946cc';
const bucketName = 'media-miregalo';
const publicDomain = 'https://media.miregalo.us';

// Supabase Credentials
const sbUrl = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(sbUrl, sbKey);

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

const BLOG_TOPIC_CONFIGS = [
  {
    catId: 'd86161e1-54d2-4280-ac89-b0e212ee834e', // Relaciones de Pareja
    catSlug: 'relaciones',
    sourceFile: 'hero_blog_relaciones_1791699280389.jpg',
    targetFile: 'hero_blog_relaciones.jpg',
    featuredPostId: 'post-regalos-winter-date-ideas',
    featuredPostTitle: '30 Ideas Románticas para Citas de Invierno que Fortalecerán Vuestra Conexión',
    publishedAt: '2026-10-10T15:05:00.000Z'
  },
  {
    catId: 'af2f3c09-6c84-4983-9275-8f16cad2dd52', // Frases y Dedicatorias
    catSlug: 'frases',
    sourceFile: 'hero_blog_frases_1791699299935.jpg',
    targetFile: 'hero_blog_frases.jpg',
    featuredPostId: 'post-regalos-san-valentin-poems',
    featuredPostTitle: '25 Poemas y Dedicatorias Románticas para Expresar tu Amor Verdadero',
    publishedAt: '2026-10-10T15:04:00.000Z'
  },
  {
    catId: 'ca52fa33-1608-4114-b9b9-b78fe281517c', // Fiestas y Tradiciones
    catSlug: 'fiestas',
    sourceFile: 'regalos_navipapa_hero.jpg',
    targetFile: 'hero_blog_fiestas.jpg',
    featuredPostId: 'post-regalos-san-valentin-decor-ideas',
    featuredPostTitle: 'Más de 40 Ideas Festivas y Tradiciones de Decoración para Celebrar Momentos Inolvidables',
    publishedAt: '2026-10-10T15:03:00.000Z'
  },
  {
    catId: 'dd882330-4cba-40f0-9773-2241e3942146', // Familia
    catSlug: 'familia',
    sourceFile: 'regalos_family_hero.jpg',
    targetFile: 'hero_blog_familia.jpg',
    featuredPostId: 'post-regalos-advice-to-new-parents',
    featuredPostTitle: 'Consejos Esenciales para la Familia: Claves de Convivencia y Crianza con Amor',
    publishedAt: '2026-10-10T15:02:00.000Z'
  },
  {
    catId: 'c92bbe28-3a13-4059-b4e8-2c5656cbcf3c', // Eventos y Celebraciones
    catSlug: 'eventos',
    sourceFile: 'regalos_events_hero.jpg',
    targetFile: 'hero_blog_eventos.jpg',
    featuredPostId: 'post-regalos-engagement-party-venue',
    featuredPostTitle: 'Guía Definitiva para Elegir el Lugar Perfecto para Fiestas y Grandes Celebraciones',
    publishedAt: '2026-10-10T15:01:00.000Z'
  }
];

async function main() {
  console.log('=== 1. PREPARING & UPLOADING 5 BLOG TOPIC HERO IMAGES ===\n');
  if (!fs.existsSync(PUBLIC_HEROES_DIR)) {
    fs.mkdirSync(PUBLIC_HEROES_DIR, { recursive: true });
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey }
  });

  for (const cfg of BLOG_TOPIC_CONFIGS) {
    const srcPath = path.join(ARTIFACT_DIR, cfg.sourceFile);
    const destPath = path.join(PUBLIC_HEROES_DIR, cfg.targetFile);

    if (!fs.existsSync(srcPath)) {
      console.error(`❌ Source artifact not found: ${srcPath}`);
      continue;
    }

    const fileBuf = fs.readFileSync(srcPath);
    fs.writeFileSync(destPath, fileBuf);
    console.log(`✅ [LOCAL] Copied ${cfg.targetFile} (${fileBuf.length} bytes)`);

    const r2Key = `media/heroes/${cfg.targetFile}`;
    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: r2Key,
      Body: fileBuf,
      ContentType: 'image/jpeg',
      CacheControl: 'public, max-age=31536000, immutable'
    }));
    console.log(`✅ [R2] Uploaded to https://media.miregalo.us/${r2Key}`);
  }

  console.log('\n=== 2. UPDATING CATEGORIES HERO_IMAGE IN LOCAL & SUPABASE ===\n');
  const dbData = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

  for (const cfg of BLOG_TOPIC_CONFIGS) {
    const imgUrl = `${publicDomain}/media/heroes/${cfg.targetFile}`;
    
    // Update category in local db.json
    const cIdx = dbData.categories.findIndex(c => c.id === cfg.catId);
    if (cIdx !== -1) {
      dbData.categories[cIdx].hero_image = imgUrl;
      console.log(`✅ [LOCAL CAT] Updated ${dbData.categories[cIdx].name} hero_image`);
    }

    // Update category in Supabase
    const { error: catErr } = await sb.from('categories').update({
      hero_image: imgUrl
    }).eq('id', cfg.catId);

    if (catErr) {
      console.error(`❌ Error updating category ${cfg.catId}:`, catErr);
    } else {
      console.log(`✅ [SUPABASE CAT] Updated category ${cfg.catSlug} hero_image`);
    }

    // Update featured post in local db.json
    const pIdx = dbData.posts.findIndex(p => p.id === cfg.featuredPostId);
    if (pIdx !== -1) {
      dbData.posts[pIdx].title = cfg.featuredPostTitle;
      dbData.posts[pIdx].hero_image = imgUrl;
      dbData.posts[pIdx].hero_alt = cfg.featuredPostTitle;
      dbData.posts[pIdx].og_image = imgUrl;
      dbData.posts[pIdx].primary_category_id = cfg.catId;
      dbData.posts[pIdx].category_ids = [cfg.catId];
      dbData.posts[pIdx].published_at = cfg.publishedAt;
      dbData.posts[pIdx].updated_at = cfg.publishedAt;
      dbData.posts[pIdx].type = 'blog';
      console.log(`✅ [LOCAL POST] Updated featured post ${cfg.featuredPostId}`);
    }

    // Update featured post in Supabase
    const { error: postErr } = await sb.from('posts').update({
      title: cfg.featuredPostTitle,
      hero_image: imgUrl,
      hero_alt: cfg.featuredPostTitle,
      og_image: imgUrl,
      primary_category_id: cfg.catId,
      category_ids: [cfg.catId],
      published_at: cfg.publishedAt,
      updated_at: cfg.publishedAt,
      type: 'blog'
    }).eq('id', cfg.featuredPostId);

    if (postErr) {
      console.error(`❌ Error updating post ${cfg.featuredPostId}:`, postErr);
    } else {
      console.log(`✅ [SUPABASE POST] Updated featured post ${cfg.featuredPostId}`);
    }
  }

  // Clean up taxonomy mismatches:
  // 1. Remove Fiestas category from eSIM post
  const esimIdx = dbData.posts.findIndex(p => p.id === 'post-regalos-how-business-travelers-benefit-from-esim-in-asia');
  if (esimIdx !== -1) {
    dbData.posts[esimIdx].category_ids = [];
    dbData.posts[esimIdx].primary_category_id = null;
  }
  await sb.from('posts').update({
    category_ids: [],
    primary_category_id: null
  }).eq('id', 'post-regalos-how-business-travelers-benefit-from-esim-in-asia');
  console.log(`✅ Detached eSIM post from Fiestas y Tradiciones`);

  // 2. Remove Familia from date-ideas-for-busy-couples (keep only Relaciones)
  const busyCouplesIdx = dbData.posts.findIndex(p => p.id === 'post-regalos-date-ideas-for-busy-couples');
  if (busyCouplesIdx !== -1) {
    dbData.posts[busyCouplesIdx].category_ids = ['d86161e1-54d2-4280-ac89-b0e212ee834e'];
    dbData.posts[busyCouplesIdx].primary_category_id = 'd86161e1-54d2-4280-ac89-b0e212ee834e';
  }
  await sb.from('posts').update({
    category_ids: ['d86161e1-54d2-4280-ac89-b0e212ee834e'],
    primary_category_id: 'd86161e1-54d2-4280-ac89-b0e212ee834e'
  }).eq('id', 'post-regalos-date-ideas-for-busy-couples');
  console.log(`✅ Detached couples post from Familia`);

  fs.writeFileSync(DB_PATH, JSON.stringify(dbData, null, 2), 'utf8');
  console.log('\n🎉 ALL 5 BLOG TOPIC HEROES AND CATEGORIES SUCCESSFULLY APPLIED!');
}

main().catch(console.error);
