// scripts/translate-and-seed-all-articles.mjs
import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), 'data', 'scraped-cache.json');
const DB_FILE = path.join(process.cwd(), 'data', 'db.json');
const SEED_FILE = path.join(process.cwd(), 'data', 'seed.json');

const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

console.log('========================================================');
console.log('🚀 TRANSLATING & SEEDING ALL 1700+ ARTICLES TO SPANISH');
console.log('========================================================\n');

// Ensure multi-platform merchants exist
const initialMerchants = [
  {
    id: 'mch-amazon-es',
    name: 'Amazon España',
    slug: 'amazon-es',
    website_url: 'https://www.amazon.es',
    affiliate_network: 'Amazon Associates',
    affiliate_param: 'tag=giftblog-21',
    commission_rate: '3% - 12%',
    active: true,
  },
  {
    id: 'mch-el-corte-ingles',
    name: 'El Corte Inglés (Awin)',
    slug: 'el-corte-ingles',
    website_url: 'https://www.elcorteingles.es',
    affiliate_network: 'Awin',
    affiliate_param: 'awinaffid=128945',
    commission_rate: '5% - 10%',
    active: true,
  },
  {
    id: 'mch-ebay-es',
    name: 'eBay Partner Network',
    slug: 'ebay-es',
    website_url: 'https://www.ebay.es',
    affiliate_network: 'eBay Partner Network',
    affiliate_param: 'campid=5338901234',
    commission_rate: '4% - 8%',
    active: true,
  },
  {
    id: 'mch-walmart',
    name: 'Walmart Impact',
    slug: 'walmart',
    website_url: 'https://www.walmart.com',
    affiliate_network: 'Walmart Creator & Impact',
    affiliate_param: 'affil=wm-giftblog-987',
    commission_rate: '4% - 10%',
    active: true,
  },
  {
    id: 'mch-etsy-es',
    name: 'Etsy España (Awin)',
    slug: 'etsy-es',
    website_url: 'https://www.etsy.com/es/',
    affiliate_network: 'Awin',
    affiliate_param: 'tag=etsy-aff',
    commission_rate: '4% - 8%',
    active: true,
  },
];

db.merchants = initialMerchants;

const productMap = new Map();
if (Array.isArray(db.products)) {
  for (const p of db.products) productMap.set(p.slug, p);
}

// Ensure amazon-regalo-destacado exists in products
if (!productMap.has('amazon-regalo-destacado')) {
  productMap.set('amazon-regalo-destacado', {
    id: 'prod-amazon-featured',
    name: 'Regalo Destacado de Amazon España',
    slug: 'amazon-regalo-destacado',
    category: 'regalos',
    price: '29,99 €',
    merchant: 'Amazon España',
    url: 'https://www.amazon.es/?tag=giftblog-21',
    image: 'https://storage.googleapis.com/loveable.appspot.com/medium_necklace1_b337bcdf8b/medium_necklace1_b337bcdf8b.jpg',
    description: 'Producto prémium recomendado con envío rápido Prime en 24 horas y garantía de devolución.',
    active: true,
    rating: 4.8,
    reviews_count: 1250,
    created_at: new Date().toISOString(),
  });
}

// 1. Curated anchor articles (ensures our canonical core URLs exist)
const curatedSlugs = new Set([
  'regalos-primer-mes-aniversario',
  'regalos-1-ano-aniversario-novio',
  'regalos-primer-aniversario-para-el',
  'regalos-para-abuela-ultima-hora',
  'regalos-primer-aniversario-novia',
  'regalos-2-anos-aniversario',
  'regalos-5-anos-aniversario-madera',
  'regalos-10-anos-aniversario-esposa',
  'regalos-bodas-de-plata-esposa',
  'regalos-cumpleanos-para-mama',
  'regalos-cumpleanos-para-papa',
  'mejores-regalos-para-hermana',
  'mejores-regalos-para-hermano',
  'regalos-emotivos-para-abuela',
  'regalos-practicos-para-abuelo',
  'regalos-originales-para-mejor-amiga',
  'regalos-navidad-para-padres',
  'regalos-san-valentin-para-el',
  'regalos-san-valentin-para-ella',
  'regalos-dia-de-la-madre-espana',
  'regalos-dia-del-padre-espana',
  'regalos-para-estrenar-casa-nueva',
  'regalos-de-boda-para-novios',
  'regalos-bodas-de-madera',
  'regalos-1-ano-noviazgo',
  'regalos-bodas-de-aluminio-10-anos-para-esposa',
  'sobre-nosotros'
]);

const exactSlugMap = {
  '1-month-anniversary-gifts': 'regalos-primer-mes-aniversario',
  '1-year-dating-anniversary-gifts': 'regalos-1-ano-noviazgo',
  '1-year-anniversary-gifts-for-boyfriend': 'regalos-1-ano-aniversario-novio',
  '1-year-anniversary-gifts-for-him': 'regalos-primer-aniversario-para-el',
  '1-year-anniversary-gifts-girlfriend': 'regalos-primer-aniversario-novia',
  '2-year-anniversary-gifts': 'regalos-2-anos-aniversario',
  '5-year-anniversary-gifts': 'regalos-5-anos-aniversario-madera',
  'wooden-anniversary-gifts': 'regalos-bodas-de-madera',
  'wood-anniversary-gifts-for-him': 'regalos-bodas-de-madera-para-el',
  'valentines-day-gifts-for-him': 'regalos-san-valentin-para-el',
  'valentines-day-gifts-for-her': 'regalos-san-valentin-para-ella',
  'birthday-gifts-for-mom': 'regalos-cumpleanos-para-mama',
  'birthday-gifts-for-dad': 'regalos-cumpleanos-para-papa',
  '10-year-anniversary-gifts-wife': 'regalos-bodas-de-aluminio-10-anos-para-esposa',
  'gifts-for-sister': 'mejores-regalos-para-hermana',
  'gifts-for-brother': 'mejores-regalos-para-hermano',
  'gifts-for-best-friend': 'regalos-originales-para-mejor-amiga',
  'gifts-for-grandma': 'regalos-emotivos-para-abuela',
  'gifts-for-grandpa': 'regalos-practicos-para-abuelo',
  'christmas-gifts-for-parents': 'regalos-navidad-para-padres',
  'mothers-day-gifts': 'regalos-dia-de-la-madre-espana',
  'fathers-day-gifts': 'regalos-dia-del-padre-espana',
  'housewarming-gift-ideas': 'regalos-para-estrenar-casa-nueva',
  'wedding-gift-ideas': 'regalos-de-boda-para-novios',
  'about-us': 'sobre-nosotros',
};

// 2. Token translation dictionary for slugs
const slugReplacements = [
  [/^blog\//i, ''],
  [/^gifts-for-/i, 'para-'],
  [/^gifts-/i, ''],
  [/^best-/i, ''],
  [/-gifts-for-/gi, '-para-'],
  [/-gifts$/gi, ''],
  [/-gift$/gi, ''],
  [/gifts/gi, 'regalos'],
  [/1-month-anniversary/gi, 'primer-mes-aniversario'],
  [/1-year-dating-anniversary/gi, '1-ano-noviazgo'],
  [/1-year-anniversary/gi, '1-ano-aniversario'],
  [/2-year-anniversary/gi, '2-anos-aniversario'],
  [/3-year-anniversary/gi, '3-anos-aniversario'],
  [/4-year-anniversary/gi, '4-anos-aniversario'],
  [/5-year-anniversary/gi, '5-anos-aniversario'],
  [/6-month-anniversary/gi, '6-meses-aniversario'],
  [/6-year-anniversary/gi, '6-anos-aniversario'],
  [/7-year-anniversary/gi, '7-anos-aniversario'],
  [/8-year-anniversary/gi, '8-anos-aniversario'],
  [/9-year-anniversary/gi, '9-anos-aniversario'],
  [/10-year-anniversary/gi, '10-anos-aniversario'],
  [/12-year-anniversary/gi, '12-anos-aniversario'],
  [/15-year-anniversary/gi, '15-anos-aniversario'],
  [/20-year-anniversary/gi, '20-anos-aniversario'],
  [/25-year-anniversary/gi, '25-anos-bodas-plata'],
  [/30-year-anniversary/gi, '30-anos-aniversario'],
  [/50-year-anniversary/gi, '50-anos-bodas-oro'],
  [/wooden-anniversary/gi, 'bodas-de-madera'],
  [/wood-anniversary/gi, 'bodas-de-madera'],
  [/tin-anniversary/gi, 'bodas-de-aluminio'],
  [/silver-anniversary/gi, 'bodas-de-plata'],
  [/golden-anniversary/gi, 'bodas-de-oro'],
  [/anniversary/gi, 'aniversario'],
  [/birthday/gi, 'cumpleanos'],
  [/bday/gi, 'cumpleanos'],
  [/valentines-day/gi, 'san-valentin'],
  [/valentine/gi, 'san-valentin'],
  [/mothers-day/gi, 'dia-de-la-madre'],
  [/fathers-day/gi, 'dia-del-padre'],
  [/christmas/gi, 'navidad'],
  [/xmas/gi, 'navidad'],
  [/wedding/gi, 'boda'],
  [/bridal/gi, 'boda-novia'],
  [/graduation/gi, 'graduacion'],
  [/housewarming/gi, 'nueva-casa'],
  [/retirement/gi, 'jubilacion'],
  [/baby-shower/gi, 'baby-shower'],
  [/white-elephant/gi, 'amigo-invisible'],
  [/secret-santa/gi, 'amigo-invisible'],
  [/stocking-stuffer/gi, 'detalles-navidad'],
  [/for-boyfriend/gi, 'para-novio'],
  [/for-girlfriend/gi, 'para-novia'],
  [/for-husband/gi, 'para-esposo'],
  [/for-wife/gi, 'para-esposa'],
  [/for-mom/gi, 'para-mama'],
  [/for-dad/gi, 'para-papa'],
  [/for-grandma/gi, 'para-abuela'],
  [/for-grandpa/gi, 'para-abuelo'],
  [/for-sister-in-law/gi, 'para-cunada'],
  [/for-brother-in-law/gi, 'para-cunado'],
  [/for-mother-in-law/gi, 'para-suegra'],
  [/for-father-in-law/gi, 'para-suegro'],
  [/for-sister/gi, 'para-hermana'],
  [/for-brother/gi, 'para-hermano'],
  [/for-daughter/gi, 'para-hija'],
  [/for-son/gi, 'para-hijo'],
  [/for-best-friend/gi, 'para-mejor-amiga'],
  [/for-friends/gi, 'para-amigos'],
  [/for-friend/gi, 'para-amigo'],
  [/for-teachers/gi, 'para-profesores'],
  [/for-teacher/gi, 'para-profesor'],
  [/for-nurses/gi, 'para-enfermeras'],
  [/for-nurse/gi, 'para-enfermera'],
  [/for-him/gi, 'para-el'],
  [/for-her/gi, 'para-ella'],
  [/for-men/gi, 'para-hombres'],
  [/for-women/gi, 'para-mujeres'],
  [/for-teens/gi, 'para-adolescentes'],
  [/for-kids/gi, 'para-ninos'],
  [/for-couples/gi, 'para-parejas'],
  [/for-coworkers/gi, 'para-companeros-trabajo'],
  [/for-boss/gi, 'para-jefe'],
  [/for-dog-lovers/gi, 'para-amantes-perros'],
  [/for-cat-lovers/gi, 'para-amantes-gatos'],
  [/personalized/gi, 'personalizados'],
  [/custom/gi, 'a-medida'],
  [/funny/gi, 'divertidos'],
  [/sentimental/gi, 'emotivos'],
  [/romantic/gi, 'romanticos'],
  [/unique/gi, 'unicos'],
  [/useful/gi, 'utiles'],
  [/practical/gi, 'practicos'],
  [/cheap/gi, 'baratos'],
  [/last-minute/gi, 'ultima-hora'],
  [/woodworking/gi, 'carpinteria'],
  [/camping/gi, 'camping'],
  [/hiking/gi, 'senderismo'],
  [/fishing/gi, 'pesca'],
  [/golf/gi, 'golf'],
  [/coffee/gi, 'cafe'],
  [/beer/gi, 'cerveza'],
  [/wine/gi, 'vino'],
  [/book-lovers/gi, 'lectores'],
  [/readers/gi, 'lectores'],
  [/jokes/gi, 'chistes'],
  [/quotes/gi, 'frases'],
  [/wishes/gi, 'deseos'],
  [/boyfriend/gi, 'novio'],
  [/girlfriend/gi, 'novia'],
  [/husband/gi, 'esposo'],
  [/wife/gi, 'esposa'],
  [/dad/gi, 'papa'],
  [/mom/gi, 'mama'],
  [/grandma/gi, 'abuela'],
  [/grandpa/gi, 'abuelo'],
  [/sister/gi, 'hermana'],
  [/brother/gi, 'hermano'],
  [/daughter/gi, 'hija'],
  [/son/gi, 'hijo'],
];

function translateSlugToSpanish(origSlug) {
  if (exactSlugMap[origSlug]) return exactSlugMap[origSlug];

  let res = origSlug.toLowerCase();
  for (const [re, rep] of slugReplacements) {
    res = res.replace(re, rep);
  }

  res = res.replace(/-+/g, '-').replace(/^-|-$/g, '');

  if (!res.startsWith('chistes-') && !res.startsWith('frases-') && !res.startsWith('ideas-') && !res.startsWith('guia-') && !res.startsWith('regalos-')) {
    res = 'regalos-' + res;
  }

  return res.slice(0, 80).replace(/-+$/, '');
}

// 3. Category & Silo mappings
const categoryMapById = new Map(db.categories.map(c => [c.slug, c.id]));
const defaultCatId = db.categories.find(c => c.slug === 'regalos')?.id || db.categories[0].id;

const recipientRules = [
  { test: /\b(boyfriend|bf|novio)\b/i, label: 'Novio', prep: 'para novio', catSlug: 'para-parejas', catalog: '/regalos/para-novio/' },
  { test: /\b(girlfriend|gf|novia)\b/i, label: 'Novia', prep: 'para novia', catSlug: 'para-parejas', catalog: '/regalos/para-novia/' },
  { test: /\b(husband|esposo)\b/i, label: 'Esposo', prep: 'para esposo', catSlug: 'para-parejas', catalog: '/regalos/para-esposo/' },
  { test: /\b(wife|esposa)\b/i, label: 'Esposa', prep: 'para esposa', catSlug: 'para-parejas', catalog: '/regalos/para-esposa/' },
  { test: /\b(mom|mother|mama|stepmom|suegra)\b/i, label: 'Mamá', prep: 'para mamá', catSlug: 'para-mama', catalog: '/regalos/para-mama/' },
  { test: /\b(dad|father|papa|stepdad|suegro)\b/i, label: 'Papá', prep: 'para papá', catSlug: 'para-papa', catalog: '/regalos/para-papa/' },
  { test: /\b(grandma|grandmother|abuela)\b/i, label: 'Abuela', prep: 'para la abuela', catSlug: 'para-mama', catalog: '/regalos/para-abuela/' },
  { test: /\b(grandpa|grandfather|abuelo)\b/i, label: 'Abuelo', prep: 'para el abuelo', catSlug: 'para-papa', catalog: '/regalos/para-abuelo/' },
  { test: /\b(sister|hermana|cunada)\b/i, label: 'Hermana', prep: 'para tu hermana', catSlug: 'para-mujeres', catalog: '/regalos/para-hermana/' },
  { test: /\b(brother|hermano|cunado)\b/i, label: 'Hermano', prep: 'para tu hermano', catSlug: 'para-hombres', catalog: '/regalos/para-hermano/' },
  { test: /\b(daughter|hija)\b/i, label: 'Hija', prep: 'para tu hija', catSlug: 'para-mujeres', catalog: '/regalos/para-hija/' },
  { test: /\b(son|hijo)\b/i, label: 'Hijo', prep: 'para tu hijo', catSlug: 'para-hombres', catalog: '/regalos/para-hijo/' },
  { test: /\b(best-friend|bff|mejor-amiga)\b/i, label: 'Mejor Amiga', prep: 'para tu mejor amiga', catSlug: 'para-amigos', catalog: '/regalos/para-amiga/' },
  { test: /\b(friend|amigo|amiga|amigos)\b/i, label: 'Amigos', prep: 'para amigos', catSlug: 'para-amigos', catalog: '/regalos/para-amigos/' },
  { test: /\b(teacher|profesor|profesora|maestra|maestro)\b/i, label: 'Profesores', prep: 'para profesores y maestros', catSlug: 'para-todos', catalog: '/regalos/para-maestra/' },
  { test: /\b(nurse|enfermera|doctor)\b/i, label: 'Enfermeras', prep: 'para enfermeras y sanitarios', catSlug: 'para-mujeres', catalog: '/regalos/para-amiga/' },
  { test: /\b(coworker|companero|boss|jefe)\b/i, label: 'Compañeros de Trabajo', prep: 'para compañeros de trabajo', catSlug: 'para-amigos', catalog: '/regalos/para-amigo/' },
  { test: /\b(couple|pareja|dating|noviazgo)\b/i, label: 'Parejas', prep: 'para parejas', catSlug: 'para-parejas', catalog: '/regalos/aniversario/' },
  { test: /\b(men|him|hombres|para-el)\b/i, label: 'Hombres', prep: 'para él', catSlug: 'para-hombres', catalog: '/regalos/para-hombres/' },
  { test: /\b(women|her|mujeres|para-ella)\b/i, label: 'Mujeres', prep: 'para ella', catSlug: 'para-mujeres', catalog: '/regalos/para-mujeres/' },
  { test: /\b(teen|adolescentes)\b/i, label: 'Adolescentes', prep: 'para adolescentes', catSlug: 'para-ninos-y-adolescentes', catalog: '/regalos/para-ninos-y-adolescentes/' },
  { test: /\b(kids|children|ninos|bebe|baby)\b/i, label: 'Niños', prep: 'para niños y peques', catSlug: 'para-ninos-y-adolescentes', catalog: '/regalos/para-ninos-y-adolescentes/' },
];

const occasionRules = [
  { test: /\b(1-month-anniversary|primer-mes)\b/i, label: 'Primer Mes de Aniversario', catSlug: 'aniversario', catalog: '/regalos/aniversario/' },
  { test: /\b(1-year-dating|noviazgo)\b/i, label: '1 Año de Noviazgo', catSlug: 'aniversario', catalog: '/regalos/aniversario/' },
  { test: /\b(1-year-anniversary|primer-aniversario)\b/i, label: '1 Año de Aniversario', catSlug: 'aniversario', catalog: '/regalos/aniversario/' },
  { test: /\b(2-year-anniversary|2-anos)\b/i, label: '2 Años de Aniversario', catSlug: 'aniversario', catalog: '/regalos/aniversario/' },
  { test: /\b(5-year-anniversary|wood|madera)\b/i, label: 'Bodas de Madera (5 Años)', catSlug: 'aniversario', catalog: '/regalos/aniversario/' },
  { test: /\b(10-year-anniversary|aluminio)\b/i, label: 'Bodas de Aluminio (10 Años)', catSlug: 'aniversario', catalog: '/regalos/aniversario/' },
  { test: /\b(25-year-anniversary|plata)\b/i, label: 'Bodas de Plata (25 Años)', catSlug: 'aniversario', catalog: '/regalos/aniversario/' },
  { test: /\b(50-year-anniversary|oro)\b/i, label: 'Bodas de Oro (50 Años)', catSlug: 'aniversario', catalog: '/regalos/aniversario/' },
  { test: /\b(anniversary|aniversario)\b/i, label: 'Aniversario de Pareja', catSlug: 'aniversario', catalog: '/regalos/aniversario/' },
  { test: /\b(birthday|cumpleanos)\b/i, label: 'Cumpleaños', catSlug: 'cumpleanos', catalog: '/regalos/cumpleanos/' },
  { test: /\b(valentine|san-valentin)\b/i, label: 'San Valentín', catSlug: 'san-valentin', catalog: '/regalos/san-valentin/' },
  { test: /\b(christmas|navidad|reyes)\b/i, label: 'Navidad y Reyes', catSlug: 'navidad', catalog: '/regalos/navidad/' },
  { test: /\b(mothers-day|dia-de-la-madre)\b/i, label: 'Día de la Madre', catSlug: 'para-mama', catalog: '/regalos/dia-de-la-madre/' },
  { test: /\b(fathers-day|dia-del-padre)\b/i, label: 'Día del Padre', catSlug: 'para-papa', catalog: '/regalos/dia-del-padre/' },
  { test: /\b(wedding|boda)\b/i, label: 'Bodas', catSlug: 'bodas', catalog: '/regalos/bodas/' },
  { test: /\b(graduation|graduacion)\b/i, label: 'Graduación', catSlug: 'graduacion', catalog: '/regalos/originales/' },
  { test: /\b(housewarming|nueva-casa)\b/i, label: 'Nueva Casa e Inauguración', catSlug: 'nueva-casa', catalog: '/regalos/originales/' },
  { test: /\b(retirement|jubilacion)\b/i, label: 'Jubilación', catSlug: 'populares', catalog: '/regalos/originales/' },
  { test: /\b(baby-shower)\b/i, label: 'Baby Shower', catSlug: 'para-mama', catalog: '/regalos/para-mama/' },
];

function translateHeading(h) {
  if (!h) return 'Detalle Especial Seleccionado';
  return h
    .replace(/\bPersonalized\b/gi, 'Personalizado')
    .replace(/\bCustom\b/gi, 'A Medida')
    .replace(/\bWooden\b/gi, 'de Madera')
    .replace(/\bLeather\b/gi, 'de Cuero')
    .replace(/\bNecklace\b/gi, 'Collar')
    .replace(/\bBracelet\b/gi, 'Pulsera')
    .replace(/\bRing\b/gi, 'Anillo')
    .replace(/\bWatch\b/gi, 'Reloj')
    .replace(/\bMug\b/gi, 'Taza')
    .replace(/\bBlanket\b/gi, 'Manta')
    .replace(/\bPlaque\b/gi, 'Placa Decorativa')
    .replace(/\bSign\b/gi, 'Cartel')
    .replace(/\bCandle\b/gi, 'Vela Aromática')
    .replace(/\bKeychain\b/gi, 'Llavero')
    .replace(/\bWallet\b/gi, 'Billetera')
    .replace(/\bLamp\b/gi, 'Lámpara LED')
    .replace(/\bGift Box\b/gi, 'Caja Regalo')
    .replace(/\bStar Map\b/gi, 'Mapa Estelar')
    .replace(/\bFor Him\b/gi, 'para Él')
    .replace(/\bFor Her\b/gi, 'para Ella')
    .trim();
}

const usedSlugs = new Set();
const newPosts = [];
const newRedirects = [];
const newInternalLinks = [];

const RESERVED_NO_REDIRECT = new Set([
  '/',
  '/blog/',
  '/regalos/',
  '/destinatarios/',
  '/ocasiones/',
  '/intereses/',
  '/search/',
  '/author/',
  '/admin/',
]);

// Helper to add post safely
function addPost(postObj, origSlug, catalogUrl, catSlug) {
  usedSlugs.add(postObj.slug);
  newPosts.push(postObj);

  // Redirect
  if (origSlug) {
    const origSrc = `/${origSlug.replace(/^\/|\/$/g, '')}/`;
    const newDest = `/${postObj.slug}/`;
    if (origSrc !== newDest && !RESERVED_NO_REDIRECT.has(origSrc)) {
      newRedirects.push({
        id: `red-${postObj.slug}`,
        source: origSrc,
        destination: newDest,
        code: 301,
        hits: 0,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  // Internal Links
  newInternalLinks.push({
    id: `il-${postObj.id}-hub`,
    source_post_id: postObj.id,
    target_url: catalogUrl || '/regalos/originales/',
    anchor_text: `catálogo de ${catSlug || 'regalos'}`,
    rel: null,
    created_at: new Date().toISOString(),
  });
  newInternalLinks.push({
    id: `il-${postObj.id}-root`,
    source_post_id: postObj.id,
    target_url: '/regalos/',
    anchor_text: 'directorio de regalos',
    rel: null,
    created_at: new Date().toISOString(),
  });
}

// 4. First seed the 21 Curated Anchor Posts
const anchorPosts = [
  {
    slug: 'regalos-san-valentin-para-el',
    origSlug: 'valentines-day-gifts-for-him',
    title: 'San Valentín para Él: 15 Regalos Románticos y Útiles que Conquistan',
    catSlug: 'san-valentin',
    catalogUrl: '/regalos/san-valentin/',
    excerpt: 'Sorprende a tu chico en el día de los enamorados con regalos originales, kits románticos y gadgets especiales.',
  },
  {
    slug: 'regalos-san-valentin-para-ella',
    origSlug: 'valentines-day-gifts-for-her',
    title: 'San Valentín para Ella: 16 Ideas para Enamorarla en el Día Más Romántico',
    catSlug: 'san-valentin',
    catalogUrl: '/regalos/san-valentin/',
    excerpt: 'Encuentra el regalo de San Valentín perfecto para tu novia o esposa: joyas personalizadas, cajas gourmet y recuerdos emotivos.',
  },
  {
    slug: 'regalos-primer-mes-aniversario',
    origSlug: '1-month-anniversary-gifts',
    title: '35 Mejores Regalos para el Primer Mes de Aniversario: Detalles Románticos',
    catSlug: 'aniversario',
    catalogUrl: '/regalos/aniversario/',
    excerpt: 'Celebra vuestro primer mes de novios con detalles sutiles, románticos y emotivos para recordar siempre.',
  },
  {
    slug: 'regalos-bodas-de-madera',
    origSlug: 'wooden-anniversary-gifts',
    title: '54 Mejores Regalos de Bodas de Madera: Ideas Inolvidables para el 5º Aniversario',
    catSlug: 'aniversario',
    catalogUrl: '/regalos/aniversario/',
    excerpt: 'Descubre los mejores regalos en madera artesanal y personalizada para celebrar vuestro 5º aniversario de matrimonio.',
  },
  {
    slug: 'regalos-1-ano-noviazgo',
    origSlug: '1-year-dating-anniversary-gifts',
    title: '36 Mejores Regalos de 1 Año de Noviazgo para Demostrar Todo tu Amor',
    catSlug: 'aniversario',
    catalogUrl: '/regalos/aniversario/',
    excerpt: 'Ideas emotivas y recuerdos grabados para celebrar vuestro primer año oficial como pareja.',
  },
  {
    slug: 'regalos-1-ano-aniversario-novio',
    origSlug: '1-year-anniversary-gifts-for-boyfriend',
    title: '42 Mejores Regalos de 1 Año de Aniversario para tu Novio',
    catSlug: 'para-parejas',
    catalogUrl: '/regalos/para-novio/',
    excerpt: 'Regalos masculinos, románticos y prácticos que a tu novio le encantarán en vuestro primer aniversario.',
  },
  {
    slug: 'regalos-primer-aniversario-para-el',
    origSlug: '1-year-anniversary-gifts-for-him',
    title: '39 Mejores Regalos de Primer Aniversario para Él: Sorpresas Masculinas',
    catSlug: 'para-hombres',
    catalogUrl: '/regalos/para-hombres/',
    excerpt: 'Celebra vuestro primer año juntos con regalos que todo hombre aprecia: relojes, gadgets y recuerdos grabados.',
  },
  {
    slug: 'regalos-cumpleanos-para-mama',
    origSlug: 'birthday-gifts-for-mom',
    title: '35 Mejores Regalos de Cumpleaños para Mamá: Detalles que Llegan al Corazón',
    catSlug: 'para-mama',
    catalogUrl: '/regalos/para-mama/',
    excerpt: 'Rinde homenaje a mamá en su cumpleaños con regalos pensados para mimarla, emocionarla y sacarle una sonrisa.',
  },
  {
    slug: 'regalos-cumpleanos-para-papa',
    origSlug: 'birthday-gifts-for-dad',
    title: '55 Mejores Regalos de Cumpleaños para Papá Prácticos y Divertidos',
    catSlug: 'para-papa',
    catalogUrl: '/regalos/para-papa/',
    excerpt: 'Desde herramientas multiusos hasta cervezas artesanales y tecnología: los mejores regalos de cumpleaños para papá.',
  },
  {
    slug: 'regalos-bodas-de-aluminio-10-anos-para-esposa',
    origSlug: '10-year-anniversary-gifts-wife',
    title: '40 Mejores Regalos de Bodas de Aluminio (10 Años) para tu Esposa',
    catSlug: 'aniversario',
    catalogUrl: '/regalos/aniversario/',
    excerpt: 'Conmemora una década de amor inquebrantable con joyas, arte grabado y regalos de 10º aniversario para tu esposa.',
  },
  {
    slug: 'regalos-navidad-familia',
    origSlug: 'sample-christmas-gifts',
    title: 'Guía de Regalos de Navidad: Ideas Mágicas para Toda la Familia',
    catSlug: 'navidad',
    catalogUrl: '/regalos/navidad/',
    excerpt: 'Llena la nochebuena y el día de reyes de emoción con nuestra guía de regalos navideños.',
  },
  {
    slug: 'regalos-boda-novios',
    origSlug: 'wedding-gift-ideas',
    title: '15 Regalos de Boda Memorables para Sorprender a los Novios',
    catSlug: 'bodas',
    catalogUrl: '/regalos/bodas/',
    excerpt: 'Ideas elegantes y duraderas para recién casados: desde electrodomésticos de diseño hasta experiencias para dos.',
  },
  {
    slug: 'regalos-2-anos-aniversario',
    origSlug: '2-year-anniversary-gifts',
    title: '38 Mejores Regalos para el 2º Aniversario: Ideas Únicas de Bodas de Algodón',
    catSlug: 'aniversario',
    catalogUrl: '/regalos/aniversario/',
    excerpt: 'Celebra vuestro segundo aniversario de matrimonio o noviazgo con regalos originales y románticos.',
  },
  {
    slug: 'regalos-graduacion-academicos',
    origSlug: 'graduation-gifts',
    title: '25 Mejores Regalos de Graduación: Ideas Académicas y Profesionales',
    catSlug: 'graduacion',
    catalogUrl: '/regalos/originales/',
    excerpt: 'Felicita al recién graduado con regalos elegantes, tecnología útil y detalles para su nueva etapa profesional.',
  },
  {
    slug: 'regalos-amantes-naturaleza-deporte',
    origSlug: 'gifts-for-nature-lovers',
    title: '30 Mejores Regalos para Amantes de la Naturaleza y el Deporte al Aire Libre',
    catSlug: 'populares',
    catalogUrl: '/regalos/originales/',
    excerpt: 'Equipamiento de aventura, accesorios de senderismo y gadgets sostenibles para apasionados del aire libre.',
  },
  {
    slug: 'regalos-dia-del-padre-espana',
    origSlug: 'fathers-day-gifts',
    title: '45 Mejores Regalos para el Día del Padre en España: Detalles para Sorprender a Papá',
    catSlug: 'para-papa',
    catalogUrl: '/regalos/dia-del-padre/',
    excerpt: 'Encuentra el detalle perfecto para el Día del Padre: herramientas, experiencias gourmet, moda y tecnología.',
  },
];

const sampleGiftImages = [
  'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1611591475870-1763138b34c2?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1578932750294-f5075e85f44a?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&auto=format&fit=crop&q=80',
];

const fallbackGiftTemplates = [
  { name: 'Lámpara LED Luna 3D Grabada con Foto y Nombres', price: '29,99 €', pros: ['Grabado láser de alta definición', '16 colores ajustables', 'Batería recargable USB'] },
  { name: 'Cuadro Mapa Estelar Personalizado con Fecha Especial', price: '34,95 €', pros: ['Precisión astronómica certificada', 'Papel fotográfico satinado 250g', 'Listo para colgar con marco'] },
  { name: 'Caja Regalo Gourmet con Selección de Delicias Artesanales', price: '45,00 €', pros: ['Productos gourmet seleccionados', 'Caja de presentación prémium', 'Envío refrigerado'] },
  { name: 'Pulsera Grabada de Acero Inoxidable y Cuero Trenzado', price: '24,90 €', pros: ['Acero quirúrgico antialérgico', 'Cuero genuino duradero', 'Cierre magnético de seguridad'] },
  { name: 'Set de Tazas Térmicas para Pareja con Frase Emotiva', price: '22,50 €', pros: ['Aislamiento al vacío 6h calor / 12h frío', 'Libre de BPA', 'Diseño ergonómico antiderrame'] },
  { name: 'Álbum de Recuerdos Scrapbook con Kit de Accesorios', price: '19,95 €', pros: ['80 páginas de papel kraft grueso', 'Tapa dura con encuadernación en lino', 'Incluye stickers y rotuladores'] },
  { name: 'Reloj Minimalista de Diseño en Madera Natural Sostenible', price: '49,95 €', pros: ['Madera natural 100% ecológica', 'Mecanismo de cuarzo japonés', 'Caja de madera para regalo'] },
  { name: 'Set de Velas Aromáticas de Cera de Soja y Aceites Esenciales', price: '21,90 €', pros: ['Cera de soja 100% vegetal', 'Aromaterapia relajante', 'Hasta 45 horas por vela'] },
  { name: 'Cojín Personalizado con Mensaje Cariñoso y Tacto Suave', price: '18,50 €', pros: ['Tejido de terciopelo extrasuave', 'Funda lavable con cremallera oculta', 'Relleno mullido antialérgico'] },
  { name: 'Altavoz Bluetooth Vintage Portátil con Sonido Envolvente', price: '39,99 €', pros: ['Diseño retro elegante', 'Batería de hasta 10 horas', 'Bluetooth 5.3 de largo alcance'] },
  { name: 'Manta Polar de Microfibra Extrasuave con Acabado Elegante', price: '27,90 €', pros: ['Tacto sedoso hipoalergénico', 'Lavable a máquina sin perder suavidad', 'Tamaño generoso 150x200 cm'] },
  { name: 'Joyero Organizador de Viaje Compacto en Cuero Sintético', price: '23,95 €', pros: ['Compartimentos modulares para anillos y collares', 'Cierre de cremallera suave', 'Forro interior de terciopelo antiarañazos'] },
  { name: 'Kit Huerto Urbano con Semillas Aromáticas y Macetas Biodegradables', price: '26,00 €', pros: ['Semillas ecológicas certificadas', 'Guía ilustrada de cultivo paso a paso', 'Macetas 100% biodegradables'] },
  { name: 'Copa de Vino o Cava Grabada con Nombre y Mensaje Dedicado', price: '16,95 €', pros: ['Cristal de Bohemia de alta resistencia', 'Grabado láser permanente', 'Apta para lavavajillas'] },
  { name: 'Cartera Billetera Slim de Cuero con Bloqueo RFID de Seguridad', price: '28,50 €', pros: ['Protección antirrobo RFID/NFC', 'Capacidad para 8 tarjetas y billetes', 'Perfil ultrafino de bolsillo'] },
  { name: 'Difusor de Aromas Ultrasónico con Efecto Llama y Luces LED Cálidas', price: '32,90 €', pros: ['Silencioso con apagado automático', 'Capacidad para 8 horas continuas', 'Ambiente cálido y relajante'] },
  { name: 'Caja Regalo Experiencia Escapada Rural o Spa Relajante para Dos', price: '59,90 €', pros: ['Validez prolongada con cambio gratuito', 'Cientos de estancias seleccionadas', 'Ideal para disfrutar en pareja'] },
  { name: 'Botella Térmica Reutilizable de Acero Inoxidable de Doble Pared 750ml', price: '19,90 €', pros: ['Sin condensación exterior', 'Mantiene la temperatura 24 horas', 'Tapón 100% a prueba de fugas'] },
  { name: 'Llavero de Cuero y Metal Grabado con Código Spotify de Canción Especial', price: '14,95 €', pros: ['Escaneo directo en la app de música', 'Cuero grueso curtido vegetal', 'Grabado láser de máxima definición'] },
  { name: 'Libro de Preguntas y Recuerdos Guiados para Rellenar en Pareja', price: '15,90 €', pros: ['Preguntas divertidas y profundas', 'Papel satinado de alta calidad', 'Diseño interior a todo color'] },
  { name: 'Proyector de Cielo Estrellado y Galaxia con Mando a Distancia', price: '36,00 €', pros: ['Efecto nebulosa tridimensional', 'Temporizador inteligente programable', 'Regalo mágico para cualquier dormitorio'] },
  { name: 'Kit de Masaje y Relajación Corporal con Aceites Esenciales Naturales', price: '31,50 €', pros: ['Aceites 100% puros prensados en frío', 'Rodillo de masaje de madera noble', 'Aroma calmante y relajante muscular'] },
  { name: 'Juego de Cartas y Preguntas Íntimas para Parejas y Amigos', price: '20,00 €', pros: ['Más de 150 tarjetas de conversación', 'Reglas sencillas y adictivas', 'Fomenta la complicidad y risas'] },
  { name: 'Placa Acrílica Transparente con Fotografía y Soporte de Madera Iluminado', price: '25,95 €', pros: ['Metacrilato óptico de alta transparencia', 'Base de madera de haya con luz LED', 'Conexión USB con interruptor'] },
  { name: 'Bolsa Tote Bag de Algodón Orgánico Reforzado con Ilustración Especial', price: '17,50 €', pros: ['Algodón 100% orgánico certificado', 'Asas largas reforzadas para hombro', 'Resistente y sostenible'] },
];

function generateFallbackItems(topic) {
  return fallbackGiftTemplates.map((t, idx) => ({
    heading: `${t.name} para ${topic}`,
    image: sampleGiftImages[idx % sampleGiftImages.length],
    price: t.price,
    description_html: `<p>Una elección excepcional destacada por su diseño y durabilidad para sorprender con un detalle inolvidable.</p>`,
    pros: t.pros,
  }));
}

for (const anchor of anchorPosts) {
  const catId = categoryMapById.get(anchor.catSlug) || defaultCatId;
  const now = new Date().toISOString();

  const anchorRaw = cache[anchor.origSlug];
  const anchorSourceItems = (anchorRaw?.items && anchorRaw.items.length >= 20)
    ? anchorRaw.items
    : generateFallbackItems(anchor.title.split(':')[0]);

  const anchorAffiliatePlatforms = [
    {
      merchant: 'Amazon España',
      merchantId: 'mch-amazon-es',
      getUrl: (slug, h) => `https://www.amazon.es/s?k=${encodeURIComponent(h.slice(0, 40))}&tag=giftblog-21`,
      btn: 'Ver en Amazon España'
    },
    {
      merchant: 'Amazon España',
      merchantId: 'mch-amazon-es',
      getUrl: (slug, h) => `https://www.amazon.es/s?k=${encodeURIComponent(h.slice(0, 40))}&tag=giftblog-21`,
      btn: 'Ver en Amazon España'
    },
    {
      merchant: 'El Corte Inglés (Awin)',
      merchantId: 'mch-el-corte-ingles',
      getUrl: (slug, h) => `https://www.awin1.com/cread.php?awinmid=15678&awinaffid=128945&ued=https%3A%2F%2Fwww.elcorteingles.es%2Fbuscar%2F%3Fterm%3D${encodeURIComponent(h.slice(0, 40))}`,
      btn: 'Ver en El Corte Inglés'
    },
    {
      merchant: 'eBay Partner Network',
      merchantId: 'mch-ebay-es',
      getUrl: (slug, h) => `https://www.ebay.es/sch/i.html?_nkw=${encodeURIComponent(h.slice(0, 40))}&campid=5338901234&customid=giftblog`,
      btn: 'Ver en eBay'
    },
    {
      merchant: 'Walmart Impact',
      merchantId: 'mch-walmart',
      getUrl: (slug, h) => `https://goto.walmart.com/c/wm-giftblog-987/568844/9253?u=https%3A%2F%2Fwww.walmart.com%2Fsearch%3Fq%3D${encodeURIComponent(h.slice(0, 40))}`,
      btn: 'Ver en Walmart'
    },
  ];

  const anchorItems = anchorSourceItems.map((it, itemIdx) => {
    const heading = translateHeading(it.heading);
    const desc = it.description_html || '<p>Detalle seleccionado con acabados de primera calidad, listo para entregar como regalo.</p>';
    const pros = (it.pros && it.pros.length > 0)
      ? it.pros.slice(0, 4).map(p => translateHeading(p))
      : ['Presentación para regalo', 'Materiales sostenibles', 'Envío rápido 24-48h'];
    const prices = ['29,99 €', '34,90 €', '39,95 €', '45,00 €', '24,90 €', '49,95 €', '19,95 €'];
    const price = it.price || prices[itemIdx % prices.length];

    const plat = anchorAffiliatePlatforms[itemIdx % anchorAffiliatePlatforms.length];
    const cleanSlug = heading
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 45) || `anchor-item-${itemIdx}`;

    const goUrl = `/go/${cleanSlug}/`;
    const targetAffUrl = plat.getUrl(cleanSlug, heading);

    if (!productMap.has(cleanSlug)) {
      productMap.set(cleanSlug, {
        id: `prod-${cleanSlug}`,
        slug: cleanSlug,
        name: heading,
        url: targetAffUrl,
        merchant: plat.merchant,
        merchant_id: plat.merchantId,
        image: it.image || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80',
        price,
        currency: 'EUR',
        description: desc,
        tags: ['regalos', anchor.catSlug],
        clicks: 0,
        active: true,
        created_at: now,
        updated_at: now,
      });
    }

    return {
      product_id: `prod-${cleanSlug}`,
      heading,
      image: it.image || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80',
      price,
      merchant: plat.merchant,
      url: goUrl,
      description_html: desc,
      pros,
      button_label: plat.btn,
    };
  });

  addPost({
    id: `post-anchor-${anchor.slug}`,
    type: 'gift',
    slug: anchor.slug,
    title: anchor.title,
    excerpt: anchor.excerpt,
    intro_html: `
      <p>Elegir el regalo perfecto para <strong>${anchor.title}</strong> es una oportunidad maravillosa para demostrar tu afecto. Hemos seleccionado cuidadosamente los productos con mejores valoraciones y opiniones verificadas.</p>
      <p>Descubre nuestra lista recomendada y visita también nuestro <a href="${anchor.catalogUrl}">catálogo especializado en ${anchor.catSlug}</a> para más inspiración.</p>
    `.trim(),
    content_html: `
      <h2>Consejos de Compra y Elección</h2>
      <p>Acompaña siempre tu regalo con una tarjeta dedicatoria personalizada. Consulta también el <a href="${anchor.catalogUrl}">directorio de ${anchor.catSlug}</a> para conocer más detalles.</p>
    `.trim(),
    items: anchorItems,
    faqs: [
      {
        q: `¿Cuál es el mejor regalo para esta ocasión?`,
        a: `Las opciones personalizadas y las experiencias conjuntas son las que generan mayor recuerdo sentimental y satisfacción garantizada.`,
      },
      {
        q: `¿Cuánto tiempo tarda el envío en España?`,
        a: `La mayoría de artículos seleccionados se entregan en 24 a 48 horas mediante Prime en toda la península.`,
      },
      {
        q: `¿Se incluye empaquetado para regalo?`,
        a: `Sí, Amazon y las tiendas asociadas permiten seleccionar envoltorio y añadir dedicatoria en el momento del pago.`,
      },
    ],
    hero_image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=1200&auto=format&fit=crop&q=80',
    hero_alt: anchor.title,
    primary_category_id: catId,
    category_ids: [catId],
    author_id: 'a91e5d32-949f-43e6-95b2-3e28406f0e4b',
    status: 'published',
    featured: true,
    editor_pick: true,
    focus_keyword: anchor.title.toLowerCase().slice(0, 40),
    seo_title: `${anchor.title.slice(0, 55)} | Loveable Blog`,
    seo_description: anchor.excerpt.slice(0, 155),
    canonical_url: `/${anchor.slug}/`,
    robots: 'index, follow',
    og_image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=1200&auto=format&fit=crop&q=80',
    published_at: '2024-01-15T10:00:00.000Z',
    updated_at: now,
    created_at: now,
  }, anchor.origSlug, anchor.catalogUrl, anchor.catSlug);
}

// 5. Add Static About-Us Page
addPost({
  id: 'page-sobre-nosotros',
  type: 'page',
  slug: 'sobre-nosotros',
  title: 'Sobre Nosotros',
  excerpt: 'Conoce al equipo detrás de Loveable Blog, expertos en curar y recomendar los mejores regalos.',
  intro_html: '<p>En Loveable nos apasiona ayudar a las personas a encontrar los detalles más emotivos y originales.</p>',
  content_html: `
    <p>En Loveable nos apasiona ayudar a las personas a encontrar los detalles más emotivos y originales para cada celebración especial.</p>
    <p>Nuestro equipo editorial prueba, analiza y selecciona minuciosamente regalos adaptados a cada personalidad, presupuesto y ocasión.</p>
    <p>Explora nuestro <a href="/regalos/">catálogo completo de regalos</a> para descubrir ideas para toda la familia.</p>
  `,
  items: [],
  faqs: [],
  hero_image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=1200&auto=format&fit=crop&q=80',
  hero_alt: 'Sobre Nosotros - Loveable Blog',
  primary_category_id: null,
  category_ids: [],
  author_id: 'a91e5d32-949f-43e6-95b2-3e28406f0e4b',
  status: 'published',
  featured: false,
  editor_pick: false,
  focus_keyword: 'sobre nosotros',
  seo_title: 'Sobre Nosotros | Loveable Blog',
  seo_description: 'Conoce al equipo detrás de Loveable Blog, expertos en curar los mejores regalos.',
  canonical_url: '/sobre-nosotros/',
  robots: 'index, follow',
  og_image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=1200&auto=format&fit=crop&q=80',
  published_at: '2023-01-01T00:00:00.000Z',
  updated_at: new Date().toISOString(),
  created_at: '2023-01-01T00:00:00.000Z',
}, 'about-us', '/regalos/', 'regalos');

// 6. Now process all scraped source articles
const allCacheKeys = Object.keys(cache);
console.log(`Processing remaining ${allCacheKeys.length} cached source articles...`);

let scrapedCount = 0;
for (const key of allCacheKeys) {
  scrapedCount++;
  const now = new Date().toISOString();
  const raw = cache[key];
  const origSlug = raw.originalSlug || key.replace(/^\//, '').replace(/\/$/, '');

  // Skip if already covered by an anchor post
  if (anchorPosts.some(a => a.origSlug === origSlug)) continue;

  const origTitle = raw.title || origSlug;

  const recipient = recipientRules.find(r => r.test.test(origSlug) || r.test.test(origTitle));
  const occasion = occasionRules.find(o => o.test.test(origSlug) || o.test.test(origTitle));

  const catSlug = occasion?.catSlug || recipient?.catSlug || 'regalos';
  const categoryId = categoryMapById.get(catSlug) || defaultCatId;
  const catalogUrl = occasion?.catalog || recipient?.catalog || '/regalos/originales/';

  let esTopic = '';
  if (occasion && recipient) {
    esTopic = `${occasion.label} ${recipient.prep}`;
  } else if (occasion) {
    esTopic = occasion.label;
  } else if (recipient) {
    esTopic = recipient.prep;
  } else {
    esTopic = origSlug.replace(/^(gifts-|best-)/, '').replace(/-gifts$/, '').replace(/-/g, ' ');
  }

  const baseSlug = translateSlugToSpanish(origSlug);

  let uniqueSlug = baseSlug;
  let counter = 2;
  while (usedSlugs.has(uniqueSlug)) {
    uniqueSlug = `${baseSlug}-${counter++}`;
  }

  const numMatch = origTitle.match(/^(\d+)\+?\s+/);
  const itemCount = numMatch ? parseInt(numMatch[1], 10) : (raw.items?.length > 5 ? raw.items.length : 25);

  const isEditorial = uniqueSlug.startsWith('chistes-') || uniqueSlug.startsWith('frases-');
  const title = isEditorial
    ? `${itemCount} ${esTopic}: Ideas y Dedicatorias Bonitas | Loveable Blog`
    : `${itemCount} Mejores Regalos de ${esTopic}: Ideas Únicas y Originales`;

  const excerpt = `Descubre nuestra selección de los mejores regalos de ${esTopic}. Propuestas emotivas, probadas y de calidad para sorprender en cualquier momento especial.`;
  const seoDesc = excerpt.slice(0, 155);

  const introHtml = `
    <p>Encontrar el detalle perfecto para <strong>${esTopic}</strong> puede marcar la diferencia entre un regalo común y un recuerdo inolvidable. Hemos recopilado y probado las opciones más destacadas del mercado para ayudarte a acertar.</p>
    <p>Cada propuesta incluye opiniones verificadas, materiales de primera y opciones adaptadas a todos los gustos y presupuestos. Explora también nuestro <a href="${catalogUrl}">catálogo especializado en ${catSlug}</a> para más inspiración.</p>
  `.trim();

  const contentHtml = `
    <h2>Recomendaciones para Acertar con tu Regalo de ${esTopic}</h2>
    <p>Para que tu detalle sea realmente memorable, acompáñalo de una nota personalizada escrita a mano. Recuerda que en nuestro <a href="${catalogUrl}">directorio de ${catSlug}</a> y en el <a href="/regalos/">catálogo general de regalos</a> dispones de cientos de ideas complementarias.</p>
  `.trim();

  const affiliatePlatforms = [
    {
      merchant: 'Amazon España',
      merchantId: 'mch-amazon-es',
      getUrl: (slug, h) => `https://www.amazon.es/s?k=${encodeURIComponent(h.slice(0, 40))}&tag=giftblog-21`,
      btn: 'Ver en Amazon España'
    },
    {
      merchant: 'Amazon España',
      merchantId: 'mch-amazon-es',
      getUrl: (slug, h) => `https://www.amazon.es/s?k=${encodeURIComponent(h.slice(0, 40))}&tag=giftblog-21`,
      btn: 'Ver en Amazon España'
    },
    {
      merchant: 'Amazon España',
      merchantId: 'mch-amazon-es',
      getUrl: (slug, h) => `https://www.amazon.es/s?k=${encodeURIComponent(h.slice(0, 40))}&tag=giftblog-21`,
      btn: 'Ver en Amazon España'
    },
    {
      merchant: 'El Corte Inglés (Awin)',
      merchantId: 'mch-el-corte-ingles',
      getUrl: (slug, h) => `https://www.awin1.com/cread.php?awinmid=15678&awinaffid=128945&ued=https%3A%2F%2Fwww.elcorteingles.es%2Fbuscar%2F%3Fterm%3D${encodeURIComponent(h.slice(0, 40))}`,
      btn: 'Ver en El Corte Inglés'
    },
    {
      merchant: 'eBay Partner Network',
      merchantId: 'mch-ebay-es',
      getUrl: (slug, h) => `https://www.ebay.es/sch/i.html?_nkw=${encodeURIComponent(h.slice(0, 40))}&campid=5338901234&customid=giftblog`,
      btn: 'Ver en eBay'
    },
    {
      merchant: 'Walmart Impact',
      merchantId: 'mch-walmart',
      getUrl: (slug, h) => `https://goto.walmart.com/c/wm-giftblog-987/568844/9253?u=https%3A%2F%2Fwww.walmart.com%2Fsearch%3Fq%3D${encodeURIComponent(h.slice(0, 40))}`,
      btn: 'Ver en Walmart'
    },
  ];

  const sourceItems = (raw.items && raw.items.length >= 20) ? raw.items : generateFallbackItems(esTopic);

  const items = sourceItems.map((it, itemIdx) => {
    const heading = translateHeading(it.heading);
    const desc = it.description_html || `<p>Una elección excepcional destacada por su elegancia y durabilidad. Diseñada para crear un recuerdo perdurable.</p>`;
    const pros = (it.pros && it.pros.length > 0)
      ? it.pros.slice(0, 4).map(p => translateHeading(p))
      : ['Acabados de gran calidad', 'Entrega rápida en 24-48h', 'Presentación lista para obsequiar'];

    const prices = ['24,90 €', '29,99 €', '34,95 €', '39,90 €', '44,99 €', '49,95 €', '59,00 €', '19,95 €'];
    const price = prices[itemIdx % prices.length];

    const plat = affiliatePlatforms[(scrapedCount + itemIdx) % affiliatePlatforms.length];

    const cleanItemSlug = heading
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 45) || `regalo-${scrapedCount}-${itemIdx}`;

    const goUrl = `/go/${cleanItemSlug}/`;
    const targetAffUrl = plat.getUrl(cleanItemSlug, heading);

    // Register product in products library
    if (!productMap.has(cleanItemSlug)) {
      productMap.set(cleanItemSlug, {
        id: `prod-${cleanItemSlug}`,
        slug: cleanItemSlug,
        name: heading,
        url: targetAffUrl,
        merchant: plat.merchant,
        merchant_id: plat.merchantId,
        image: it.image || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80',
        price,
        currency: 'EUR',
        description: desc,
        tags: ['regalos', catSlug],
        clicks: 0,
        active: true,
        created_at: now,
        updated_at: now,
      });
    }

    return {
      product_id: `prod-${cleanItemSlug}`,
      heading,
      image: it.image || 'https://storage.googleapis.com/loveable.appspot.com/medium_necklace1_b337bcdf8b/medium_necklace1_b337bcdf8b.jpg',
      price,
      merchant: plat.merchant,
      url: goUrl,
      description_html: desc,
      pros,
      button_label: plat.btn,
    };
  });

  const faqs = [
    {
      q: `¿Cuál es el regalo más recomendado para ${esTopic}?`,
      a: `Los detalles personalizados con nombres o fechas especiales y los sets de bienestar o experiencias conjuntas son los más valorados y con mayor impacto emocional.`,
    },
    {
      q: `¿Cuánto tarda en llegar el pedido en España?`,
      a: `La mayoría de artículos seleccionados se entregan en 24 a 48 horas mediante envío Prime en la península. Los productos con grabado artesanal suelen tardar de 3 a 5 días laborables.`,
    },
    {
      q: `¿Se puede incluir dedicatoria personalizada para regalo?`,
      a: `Sí, todas las tiendas enlazadas disponen de opción de empaquetado para regalo e inclusión de tarjeta con mensaje personalizado durante el proceso de compra.`,
    },
  ];

  const postId = `post-cloned-${String(scrapedCount).padStart(4, '0')}`;

  addPost({
    id: postId,
    type: isEditorial ? 'blog' : 'gift',
    slug: uniqueSlug,
    title,
    excerpt,
    intro_html: introHtml,
    content_html: contentHtml,
    items,
    faqs,
    hero_image: raw.heroImage || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=1200&auto=format&fit=crop&q=80',
    hero_alt: title,
    primary_category_id: categoryId,
    category_ids: [categoryId],
    author_id: 'a91e5d32-949f-43e6-95b2-3e28406f0e4b',
    status: 'published',
    featured: scrapedCount <= 10,
    editor_pick: scrapedCount % 15 === 0,
    focus_keyword: esTopic.toLowerCase().slice(0, 40),
    seo_title: `${title.slice(0, 55)} | Loveable Blog`,
    seo_description: seoDesc,
    canonical_url: `/${uniqueSlug}/`,
    robots: 'index, follow',
    og_image: raw.heroImage || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=1200&auto=format&fit=crop&q=80',
    published_at: raw.publishedAt || '2024-01-15T10:00:00.000Z',
    updated_at: now,
    created_at: raw.publishedAt || now,
  }, origSlug, catalogUrl, catSlug);
}

// Update database
db.posts = newPosts;

// Update redirects: ensure unique sources
const redirectMap = new Map();
for (const r of newRedirects) {
  redirectMap.set(r.source, r);
}
db.redirects = Array.from(redirectMap.values());

// Update products & merchants
db.products = Array.from(productMap.values());
db.merchants = initialMerchants;

// Update internal links
db.internal_links = newInternalLinks;

// Write back to DB and SEED
fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
fs.writeFileSync(SEED_FILE, JSON.stringify(db, null, 2), 'utf8');

console.log(`\n🎉 SEEDING COMPLETE!`);
console.log(`✅ Total Posts in DB: ${db.posts.length}`);
console.log(`✅ Total Products in DB: ${db.products.length}`);
console.log(`✅ Total Merchants in DB: ${db.merchants.length}`);
console.log(`✅ Total Redirects in DB: ${db.redirects.length}`);
console.log(`✅ Total Internal Links in DB: ${db.internal_links.length}`);

