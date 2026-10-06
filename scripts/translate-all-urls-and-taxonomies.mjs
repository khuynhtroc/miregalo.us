import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'data', 'db.json');
const SEED_FILE = path.join(process.cwd(), 'data', 'seed.json');

const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

const categoryMap = {
  gifts: 'regalos',
  recipients: 'destinatarios',
  occasions: 'ocasiones',
  interests: 'intereses',
  blog: 'blog',
  women: 'para-mujeres',
  mom: 'para-mama',
  men: 'para-hombres',
  'kids-teens': 'para-ninos-y-adolescentes',
  friends: 'para-amigos',
  dad: 'para-papa',
  couples: 'para-parejas',
  anyone: 'para-todos',
  wedding: 'bodas',
  valentine: 'san-valentin',
  housewarming: 'nueva-casa',
  halloween: 'halloween',
  graduation: 'graduacion',
  christmas: 'navidad',
  birthday: 'cumpleanos',
  anniversary: 'aniversario',
  popular: 'populares',
  'outdoors-sports': 'deportes-y-aire-libre',
  animals: 'animales',
  relationship: 'relaciones',
  quotes: 'frases',
  holiday: 'fiestas',
  family: 'familia',
  events: 'eventos',
};

const postMap = {
  'about-us': 'sobre-nosotros',
  'sample-anniversary-gifts': 'regalos-aniversario-pareja',
  'sample-gifts-for-mom': 'regalos-para-mama-emotivos',
  'sample-gifts-for-dad': 'regalos-para-papa-practicos',
  'sample-christmas-gifts': 'regalos-navidad-familia',
  'sample-birthday-gifts': 'regalos-cumpleanos-originales',
  'sample-outdoor-gifts': 'regalos-amantes-naturaleza-deporte',
  'sample-wedding-gifts': 'regalos-boda-novios',
  'sample-pet-lover-gifts': 'regalos-amantes-perros-gatos',
  'sample-graduation-gifts': 'regalos-graduacion-academicos',
  'sample-gifts-for-her': 'regalos-para-ella-detalles',
  'sample-friend-gifts': 'regalos-para-amigos-amistad',
  'sample-housewarming-gifts': 'regalos-para-nueva-casa',
  'sample-date-night-ideas': 'ideas-citas-romanticas',
  'sample-birthday-wishes': 'frases-cumpleanos-tarjetas',
  'sample-holiday-traditions': 'tradiciones-festivas-familia',
  'sample-family-activities': 'actividades-familiares-casa',
  'sample-party-planning': 'guia-organizar-fiesta-sorpresa',
  'personalized-gifts-for-wife': 'regalos-personalizados-para-esposa',
  '1-month-anniversary-gifts': 'regalos-primer-mes-aniversario',
  '1-year-anniversary-gifts-for-boyfriend': 'regalos-1-ano-aniversario-novio',
  '1-year-anniversary-gifts-for-him': 'regalos-primer-aniversario-para-el',
  'regalos/para-abuela/ultima-hora': 'regalos-para-abuela-ultima-hora',
};

const now = new Date().toISOString();
db.redirects = db.redirects || [];

// 1. Update categories and add 301 redirects
for (const cat of db.categories) {
  const oldSlug = cat.slug;
  const newSlug = categoryMap[oldSlug];
  if (newSlug && newSlug !== oldSlug) {
    cat.slug = newSlug;
    cat.updated_at = now;

    // Add 301 redirect
    const src = `/${oldSlug}/`;
    const dest = `/${newSlug}/`;
    if (!db.redirects.some((r) => r.source === src)) {
      db.redirects.push({
        id: `red-${oldSlug}`,
        source: src,
        destination: dest,
        code: 301,
        hits: 0,
        active: true,
        created_at: now,
        updated_at: now,
      });
    }
  }
}

// 2. Update post slugs and add 301 redirects
for (const post of db.posts) {
  const oldSlug = post.slug;
  const newSlug = postMap[oldSlug];
  if (newSlug && newSlug !== oldSlug) {
    post.slug = newSlug;
    post.canonical_url = `/${newSlug}/`;
    post.updated_at = now;

    const src = `/${oldSlug}/`;
    const dest = `/${newSlug}/`;
    if (!db.redirects.some((r) => r.source === src)) {
      db.redirects.push({
        id: `red-${oldSlug.replace(/\//g, '-')}`,
        source: src,
        destination: dest,
        code: 301,
        hits: 0,
        active: true,
        created_at: now,
        updated_at: now,
      });
    }
  }
}

fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
fs.writeFileSync(SEED_FILE, JSON.stringify(db, null, 2), 'utf8');

console.log('✅ Updated categories & posts to Spanish slugs!');
console.log(`✅ Total 301 redirects configured: ${db.redirects.length}`);
