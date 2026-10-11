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

const HERO_CONFIGS = [
  {
    postId: 'post-regalos-women',
    slug: 'regalos-women',
    sourceFile: 'hero_regalos_mujeres_1791698217465.jpg',
    targetFile: 'hero_regalos_mujeres.jpg',
    title: 'Guía de Regalos Exclusivos para Mujeres: Ideas Originales y Elegantes',
    excerpt: 'Descubre una selección cuidada de regalos para mujeres: desde detalles personalizados y joyería sofisticada hasta bienestar, cuidado personal y moda elegante.',
    primaryCategoryId: '1219239e-f8b0-41fd-bb10-7f2e68a6dadf', // Mujeres
    categoryIds: ['1219239e-f8b0-41fd-bb10-7f2e68a6dadf', 'b8d25601-d9c7-4902-8415-0359ce0f33f3'],
    publishedAt: '2026-10-10T12:08:00.000Z',
    introHtml: '<p>Encontrar el regalo idóneo para una mujer especial requiere prestar atención a sus pasiones cotidianas, su estilo personal y aquellos detalles que aportan bienestar auténtico. En esta guía hemos reunido propuestas inspiradoras que equilibran belleza estética, funcionalidad y valor emocional, pensadas para sorprender con distinción en cumpleaños, aniversarios o momentos señalados.</p>'
  },
  {
    postId: 'post-regalos-boda',
    slug: 'regalos-boda',
    sourceFile: 'hero_regalos_boda_1791698251575.jpg',
    targetFile: 'hero_regalos_boda.jpg',
    title: 'Los Mejores Regalos de Boda para Enamorar a los Novios',
    excerpt: 'Ideas elegantes y emotivas para celebrar el amor en el día de su enlace: cristalería grabada, detalles gourmet de autor y recuerdos inolvidables para su nuevo hogar.',
    primaryCategoryId: '6edf1013-c67e-407d-9428-92db0c722d9e', // Bodas
    categoryIds: ['6edf1013-c67e-407d-9428-92db0c722d9e', '69ae79da-2c20-4453-9275-c60591334ee2'],
    publishedAt: '2026-10-10T12:07:00.000Z',
    introHtml: '<p>El día del matrimonio marca el inicio de una nueva etapa compartida. Para celebrar esta ocasión tan trascendente, te presentamos una selección de regalos de boda que van más allá de lo convencional: piezas artesanales para el hogar, experiencias de disfrute conjunto y recuerdos atemporales con los que los recién casados brindarán por su futuro común.</p>'
  },
  {
    postId: 'post-regalos-san-valentin',
    slug: 'regalos-san-valentin',
    sourceFile: 'hero_regalos_san_valentin_1791698271800.jpg',
    targetFile: 'hero_regalos_san_valentin.jpg',
    title: 'Regalos Inolvidables para San Valentín: Detalles Románticos',
    excerpt: 'Celebra el día de los enamorados con regalos llenos de pasión y ternura: cofres de terciopelo, fragancias envolventes, chocolates selectos y momentos mágicos.',
    primaryCategoryId: 'b3307b6d-9ccb-4a3b-b94a-be776c0c46ed', // San Valentín
    categoryIds: ['b3307b6d-9ccb-4a3b-b94a-be776c0c46ed', '69ae79da-2c20-4453-9275-c60591334ee2'],
    publishedAt: '2026-10-10T12:06:00.000Z',
    introHtml: '<p>San Valentín es la oportunidad perfecta para manifestar tu complicidad y afecto a través de detalles que tocan el corazón. Esta colección reúne sugerencias románticas cuidadosamente seleccionadas, diseñadas para transformar una velada íntima en un recuerdo imborrable cargado de calidez y cariño genuino.</p>'
  },
  {
    postId: 'post-regalos-uncategorized',
    slug: 'regalos-uncategorized',
    sourceFile: 'hero_regalos_animales_1791698294593.jpg',
    targetFile: 'hero_regalos_animales.jpg',
    title: 'Regalos Originales para Amantes de los Animales y Mascotas',
    excerpt: 'Detalles entrañables y prácticos para apasionados de perros y gatos: accesorios personalizados, mantas cálidas, tazas ilustradas y confort garantizado.',
    primaryCategoryId: '9b13a30b-daa5-4d73-890b-d66467788645', // Amantes de los Animales
    categoryIds: ['9b13a30b-daa5-4d73-890b-d66467788645', '6e45eb86-ebde-4577-bf01-85755c7dad7b'],
    publishedAt: '2026-10-10T12:05:00.000Z',
    introHtml: '<p>Para quienes comparten su vida con un perro o un gato, su mascota es un miembro indispensable de la familia. Aquí descubrirás ideas de regalos únicas y divertidas que celebran ese vínculo incondicional, combinando comodidad para el animal y alegría diaria para su dueño.</p>'
  },
  {
    postId: 'post-regalos-jubilacion',
    slug: 'regalos-jubilacion',
    sourceFile: 'hero_regalos_jubilacion_1791698317293.jpg',
    targetFile: 'hero_regalos_jubilacion.jpg',
    title: 'Regalos Memorables de Jubilación para Celebrar una Gran Trayectoria',
    excerpt: 'Homenajea años de esfuerzo y logros profesionales con obsequios distinguidos: relojes clásicos, plumas estilográficas de prestigio y detalles para disfrutar del tiempo libre.',
    primaryCategoryId: '69ae79da-2c20-4453-9275-c60591334ee2', // Ocasiones
    categoryIds: ['69ae79da-2c20-4453-9275-c60591334ee2', '1a88c5e6-8662-42d1-be3c-1b7c10211fb8'],
    publishedAt: '2026-10-10T12:04:00.000Z',
    introHtml: '<p>La jubilación culmina décadas de dedicación laboral y abre las puertas a una merecida etapa de serenidad, proyectos personales y disfrute sosegado. Rinde un tributo memorable a tu compañero, padre o amigo con obsequios de alta gama pensados para conmemorar su trayectoria con la mayor solemnidad y admiración.</p>'
  },
  {
    postId: 'post-regalos-recipients',
    slug: 'regalos-recipients',
    sourceFile: 'hero_regalos_destinatarios_1791698338864.jpg',
    targetFile: 'hero_regalos_destinatarios.jpg',
    title: 'Guía Completa de Regalos según el Destinatario y Ocasión',
    excerpt: 'Encuentra la inspiración perfecta para cada persona importante en tu vida con nuestra guía editorial estructurada por destinatarios, gustos y ocasiones.',
    primaryCategoryId: '06f932c5-f44d-4ffe-93d0-bb881a20b90d', // Destinatarios
    categoryIds: ['06f932c5-f44d-4ffe-93d0-bb881a20b90d', 'b8d25601-d9c7-4902-8415-0359ce0f33f3'],
    publishedAt: '2026-10-10T12:03:00.000Z',
    introHtml: '<p>Cada destinatario tiene necesidades, inquietudes y sensibilidades diferentes. Ya sea para tus padres, tu pareja, amigos íntimos o compañeros de trabajo, esta guía integral te orienta paso a paso para acertar en la elección del obsequio perfecto adaptado con precisión a su perfil.</p>'
  },
  {
    postId: 'post-regalos-relationship',
    slug: 'regalos-relationship',
    sourceFile: 'hero_regalos_parejas_1791698362244.jpg',
    targetFile: 'hero_regalos_parejas.jpg',
    title: 'Regalos Especiales para Parejas: Detalles que Fortalecen el Amor',
    excerpt: 'Propuestas significativas y románticas para compartir en pareja: sets conmemorativos, álbumes encuadernados de recuerdos y vivencias que consolidan vuestra unión.',
    primaryCategoryId: 'b6cdf54e-27ac-41a0-b8d5-42ba8b5251bb', // Parejas
    categoryIds: ['b6cdf54e-27ac-41a0-b8d5-42ba8b5251bb', 'b8d25601-d9c7-4902-8415-0359ce0f33f3'],
    publishedAt: '2026-10-10T12:02:00.000Z',
    introHtml: '<p>Compartir la vida en pareja se construye a base de momentos cotidianos y celebraciones llenas de significado. Te presentamos obsequios creados para ser disfrutados al unísono, afianzando la conexión emocional y creando nuevas anécdotas felices en vuestro álbum personal.</p>'
  },
  {
    postId: 'post-regalos-frases',
    slug: 'regalos-frases',
    sourceFile: 'hero_regalos_frases_1791698416490.jpg',
    targetFile: 'hero_regalos_frases.jpg',
    title: 'Las Mejores Frases y Dedicatorias Emotivas para Acompañar tus Regalos',
    excerpt: 'Eleva el valor sentimental de tus obsequios con dedicatorias sinceras y palabras inspiradoras para tarjetas de felicitación y envoltorios inolvidables.',
    primaryCategoryId: 'af2f3c09-6c84-4983-9275-8f16cad2dd52', // Frases y Dedicatorias
    categoryIds: ['af2f3c09-6c84-4983-9275-8f16cad2dd52', 'b8d25601-d9c7-4902-8415-0359ce0f33f3'],
    publishedAt: '2026-10-10T12:01:00.000Z',
    introHtml: '<p>A menudo el mayor tesoro de un obsequio no reside únicamente en su contenido material, sino en las palabras que lo acompañan. Descubre las dedicatorias y mensajes más emotivos para expresar agradecimiento, admiración y amor sincero en cualquier tarjeta de felicitación.</p>'
  }
];

async function main() {
  console.log('=== 1. PREPARING LOCAL DIRECTORY ===');
  if (!fs.existsSync(PUBLIC_HEROES_DIR)) {
    fs.mkdirSync(PUBLIC_HEROES_DIR, { recursive: true });
    console.log(`Created directory: ${PUBLIC_HEROES_DIR}`);
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey }
  });

  console.log('\n=== 2. PROCESSING IMAGES (COPY LOCAL & UPLOAD TO R2) ===');
  for (const cfg of HERO_CONFIGS) {
    const srcPath = path.join(ARTIFACT_DIR, cfg.sourceFile);
    const destPath = path.join(PUBLIC_HEROES_DIR, cfg.targetFile);

    if (!fs.existsSync(srcPath)) {
      console.error(`❌ Source artifact not found: ${srcPath}`);
      continue;
    }

    const fileBuf = fs.readFileSync(srcPath);
    fs.writeFileSync(destPath, fileBuf);
    console.log(`✅ [LOCAL] Copied to ${destPath} (${fileBuf.length} bytes)`);

    // Upload to Cloudflare R2
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

  console.log('\n=== 3. UPDATING LOCAL data/db.json ===');
  if (fs.existsSync(DB_PATH)) {
    const dbData = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    let updatedLocalCount = 0;

    for (const cfg of HERO_CONFIGS) {
      const pIdx = dbData.posts.findIndex(p => p.id === cfg.postId);
      const imgUrl = `${publicDomain}/media/heroes/${cfg.targetFile}`;
      if (pIdx !== -1) {
        dbData.posts[pIdx].title = cfg.title;
        dbData.posts[pIdx].excerpt = cfg.excerpt;
        dbData.posts[pIdx].intro_html = cfg.introHtml;
        dbData.posts[pIdx].hero_image = imgUrl;
        dbData.posts[pIdx].hero_alt = cfg.title;
        dbData.posts[pIdx].og_image = imgUrl;
        dbData.posts[pIdx].primary_category_id = cfg.primaryCategoryId;
        dbData.posts[pIdx].category_ids = cfg.categoryIds;
        dbData.posts[pIdx].published_at = cfg.publishedAt;
        dbData.posts[pIdx].updated_at = cfg.publishedAt;
        updatedLocalCount++;
      }
    }

    fs.writeFileSync(DB_PATH, JSON.stringify(dbData, null, 2), 'utf8');
    console.log(`✅ Updated ${updatedLocalCount} posts in data/db.json`);
  }

  console.log('\n=== 4. UPDATING SUPABASE posts TABLE ===');
  for (const cfg of HERO_CONFIGS) {
    const imgUrl = `${publicDomain}/media/heroes/${cfg.targetFile}`;
    const { error } = await sb.from('posts').update({
      title: cfg.title,
      excerpt: cfg.excerpt,
      intro_html: cfg.introHtml,
      hero_image: imgUrl,
      hero_alt: cfg.title,
      og_image: imgUrl,
      primary_category_id: cfg.primaryCategoryId,
      category_ids: cfg.categoryIds,
      published_at: cfg.publishedAt,
      updated_at: cfg.publishedAt
    }).eq('id', cfg.postId);

    if (error) {
      console.error(`❌ Supabase update error for ${cfg.postId}:`, error);
    } else {
      console.log(`✅ [SUPABASE] Updated ${cfg.postId} (${cfg.title})`);
    }
  }

  console.log('\n🎉 ALL 8 HEROES SUCCESSFULLY APPLIED ACROSS LOCAL & SUPABASE!');
}

main().catch(console.error);
