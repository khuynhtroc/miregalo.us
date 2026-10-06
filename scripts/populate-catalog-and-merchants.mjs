import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const URL_CATALOG_FILE = path.join(DATA_DIR, 'url-catalog.json');
const KEYWORD_MAP_FILE = path.join(DATA_DIR, 'keyword-url-map.json');
const MASTER_KW_FILE = path.join(DATA_DIR, 'master-keywords.json');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const SEED_FILE = path.join(DATA_DIR, 'seed.json');

const rawCatalog = JSON.parse(fs.readFileSync(URL_CATALOG_FILE, 'utf8'));
const rawKwMap = JSON.parse(fs.readFileSync(KEYWORD_MAP_FILE, 'utf8'));
const rawMasterKw = JSON.parse(fs.readFileSync(MASTER_KW_FILE, 'utf8'));

// Build catalog_urls
const now = new Date().toISOString();
const catalogUrls = rawCatalog.map((u) => {
  const title = u['Page Title'];
  let desc = `Descubre las mejores ideas de ${title.toLowerCase()}. Guía completa con regalos originales, personalizados y opciones para todos los presupuestos.`;
  if (u['URL Type'] === 'ROOT') desc = 'Loveable Blog - Ideas de regalos originales, personalizados y únicos para cada persona y ocasión especial.';
  if (u['URL Type'] === 'SILO') desc = 'Explora nuestro catálogo completo de regalos organizados por destinatario, ocasión y estilo.';

  return {
    id: u['URL ID'],
    url: u['URL'],
    page_title: title,
    url_type: u['URL Type'],
    parent_url: u['Parent URL'],
    priority: u['Priority'] || 'P1',
    status: 'LIVE',
    notes: u['Notes'] || '',
    meta_description: desc,
    h1: title,
    created_at: now,
    updated_at: now,
  };
});

// Master keywords map lookup
const masterKwById = new Map();
for (const mk of rawMasterKw) {
  masterKwById.set(mk.ID, mk);
}

// Build keywords
const keywords = rawKwMap.map((km) => {
  const id = km['Keyword ID'];
  const mk = masterKwById.get(id) || {};
  const isP1 = (km.Priority || mk.Priority) === 'P1';

  return {
    id,
    keyword: km['Primary Keyword'] || mk['Primary Keyword'],
    target_path: km['Target URL'],
    post_type: 'gift',
    cluster: mk.Cluster || km['Keyword Cluster'] || 'General',
    intent: mk.Intent || 'commercial investigation',
    volume: isP1 ? 6500 : 1800,
    difficulty: isP1 ? 35 : 22,
    priority: km.Priority || mk.Priority || 'P1',
    status: 'published',
    post_id: null,
    action: km.Action || 'PRIMARY',
    target_url_id: km['Target URL ID'],
    parent_url: km['Parent URL'],
    silo: km.Silo || 'RECIPIENT',
    recipient: mk.Recipient || '',
    occasion: mk.Occasion || '',
    budget: mk.Budget || '',
    culture: mk.Culture || '',
    page_type: mk['Page Type'] || 'guide',
    validation: mk.Validation || 'VALIDATED',
    url_decision: mk['URL Decision'] || '',
    notes: km.Notes || mk.Notes || '',
    created_at: now,
    updated_at: now,
  };
});

// Merchants
const merchants = [
  {
    id: 'mch-amazon-es',
    name: 'Amazon España',
    slug: 'amazon-es',
    website_url: 'https://www.amazon.es',
    affiliate_network: 'Amazon Associates',
    affiliate_param: 'tag=giftblog-21',
    commission_rate: '3% - 10%',
    logo_url: 'https://images.unsplash.com/photo-1523474255658-4af61b1684c4?w=100&auto=format&fit=crop&q=60',
    notes: 'Socio afiliado principal para envíos rápidos y catálogo masivo.',
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'mch-el-corte-ingles',
    name: 'El Corte Inglés',
    slug: 'el-corte-ingles',
    website_url: 'https://www.elcorteingles.es',
    affiliate_network: 'Awin',
    affiliate_param: 'tag=elcorteingles-es',
    commission_rate: '5% - 8%',
    logo_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100&auto=format&fit=crop&q=60',
    notes: 'Moda, perfumería y regalos gourmet de gama alta en España.',
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'mch-fnac-es',
    name: 'Fnac España',
    slug: 'fnac-es',
    website_url: 'https://www.fnac.es',
    affiliate_network: 'Awin',
    affiliate_param: 'tag=fnac-es',
    commission_rate: '4% - 7%',
    logo_url: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=100&auto=format&fit=crop&q=60',
    notes: 'Cultura, libros, música, gadgets y tecnología.',
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'mch-etsy-es',
    name: 'Etsy España',
    slug: 'etsy-es',
    website_url: 'https://www.etsy.com/es/',
    affiliate_network: 'Awin',
    affiliate_param: 'tag=etsy-aff',
    commission_rate: '4%',
    logo_url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=100&auto=format&fit=crop&q=60',
    notes: 'Regalos artesanales, personalizados y joyería grabada.',
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'mch-curiosite',
    name: 'Curiosite Regalos',
    slug: 'curiosite',
    website_url: 'https://www.curiosite.es',
    affiliate_network: 'Direct',
    affiliate_param: 'ref=giftblog',
    commission_rate: '8%',
    logo_url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=100&auto=format&fit=crop&q=60',
    notes: 'Artículos originales, curiosos y divertidos de regalo.',
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'mch-regalooriginal',
    name: 'Regalo Original',
    slug: 'regalo-original',
    website_url: 'https://www.regalooriginal.com',
    affiliate_network: 'Direct',
    affiliate_param: 'ref=giftblog',
    commission_rate: '10%',
    logo_url: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=100&auto=format&fit=crop&q=60',
    notes: 'Desayunos a domicilio, tazas y cojines personalizados con entrega en 24h.',
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'mch-loveable',
    name: 'Loveable Store',
    slug: 'loveable',
    website_url: 'https://loveable.us',
    affiliate_network: 'In-House Direct',
    affiliate_param: 'ref=blog-es',
    commission_rate: '15%',
    logo_url: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=100&auto=format&fit=crop&q=60',
    notes: 'Tienda propia con kits y cajas de regalo premium listas para enviar.',
    active: true,
    created_at: now,
    updated_at: now,
  },
];

// Rich Product Catalog in Spanish
const sampleProducts = [
  {
    id: 'prod-001',
    slug: 'lampara-luna-personalizada-3d',
    name: 'Lámpara de Luna 3D Personalizada con Foto y Texto',
    url: 'https://www.amazon.es/dp/B08XYZ123?tag=giftblog-21',
    merchant: 'Amazon España',
    merchant_id: 'mch-amazon-es',
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    price: '29,99 €',
    currency: 'EUR',
    description: 'Luz nocturna grabada con tecnología láser 3D. 16 colores RGB con control táctil y mando a distancia.',
    tags: ['mama', 'novia', 'esposa', 'aniversario', 'san-valentin', 'personalizados', 'sentimentales', 'romanticos'],
    clicks: 142,
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'prod-002',
    slug: 'taza-termo-inteligente-temperatura',
    name: 'Taza Térmica Inteligente con Pantalla LED de Temperatura',
    url: 'https://www.amazon.es/dp/B09ABC456?tag=giftblog-21',
    merchant: 'Amazon España',
    merchant_id: 'mch-amazon-es',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    price: '24,50 €',
    currency: 'EUR',
    description: 'Termo de acero inoxidable 500ml que mantiene bebidas calientes 12h y frías 24h. Ideal para trabajo u oficina.',
    tags: ['papa', 'novio', 'esposo', 'amigo', 'hermano', 'maestro', 'utiles', 'cumpleanos'],
    clicks: 98,
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'prod-003',
    slug: 'caja-regalo-spa-aromatica-rosa',
    name: 'Caja Regalo Spa y Cuidado Personal Lavanda & Rosas',
    url: 'https://loveable.us/products/spa-lavender-box?ref=blog-es',
    merchant: 'Loveable Store',
    merchant_id: 'mch-loveable',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80',
    price: '45,00 €',
    currency: 'EUR',
    description: 'Kit de relajación de lujo con bomba de baño, vela de soja aromática, loción de manteca de karité y antifaz de seda.',
    tags: ['mama', 'novia', 'esposa', 'hermana', 'amiga', 'dia-de-la-madre', 'navidad', 'sentimentales'],
    clicks: 185,
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'prod-004',
    slug: 'pulsera-plata-coordenadas-personalizada',
    name: 'Pulsera de Plata de Ley Grabada con Coordenadas',
    url: 'https://www.etsy.com/es/listing/123456789?tag=etsy-aff',
    merchant: 'Etsy España',
    merchant_id: 'mch-etsy-es',
    image: 'https://images.unsplash.com/photo-1611591475879-1144a6fba7c7?w=600&auto=format&fit=crop&q=80',
    price: '38,00 €',
    currency: 'EUR',
    description: 'Pulsera artesanal grabada a mano con las coordenadas exactas de vuestro primer encuentro o boda.',
    tags: ['novia', 'novio', 'esposa', 'esposo', 'aniversario', 'san-valentin', 'personalizados', 'romanticos'],
    clicks: 120,
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'prod-005',
    slug: 'kit-cerveza-artesanal-ipa-casa',
    name: 'Kit de Elaboración de Cerveza Artesanal IPA en Casa',
    url: 'https://www.curiosite.es/producto/kit-elaboracion-cerveza.html?ref=giftblog',
    merchant: 'Curiosite Regalos',
    merchant_id: 'mch-curiosite',
    image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=600&auto=format&fit=crop&q=80',
    price: '49,95 €',
    currency: 'EUR',
    description: 'Pack completo con fermentador de vidrio, lúpulo, levadura y guía paso a paso para fabricar 5 litros.',
    tags: ['papa', 'novio', 'esposo', 'amigo', 'hermano', 'cunado', 'originales', 'cumpleanos', 'dia-del-padre'],
    clicks: 114,
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'prod-006',
    slug: 'desayuno-gourmet-sorpresa-domicilio',
    name: 'Desayuno Gourmet Sorpresa a Domicilio con Rosas',
    url: 'https://www.regalooriginal.com/desayuno-gourmet.html?ref=giftblog',
    merchant: 'Regalo Original',
    merchant_id: 'mch-regalooriginal',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&auto=format&fit=crop&q=80',
    price: '36,00 €',
    currency: 'EUR',
    description: 'Bandeja de madera con zumo natural, croissants artesanales, termo con café caliente, taza de diseño y dedicatoria.',
    tags: ['mama', 'papa', 'abuela', 'abuelo', 'cumpleanos', 'dia-de-la-madre', 'dia-del-padre', 'ultima-hora'],
    clicks: 210,
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'prod-007',
    slug: 'masajeador-cuello-espalda-calor-shiatsu',
    name: 'Masajeador Cervical Shiatsu con Calor Infrarrojo',
    url: 'https://www.amazon.es/dp/B08DEF789?tag=giftblog-21',
    merchant: 'Amazon España',
    merchant_id: 'mch-amazon-es',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80',
    price: '39,99 €',
    currency: 'EUR',
    description: '8 nodos de masaje bidireccionales con 3 intensidades y función térmica relajante. Ideal para cuello, hombros y lumbares.',
    tags: ['abuela', 'abuelo', 'mama', 'papa', 'suegra', 'suegro', 'que-lo-tiene-todo', 'utiles'],
    clicks: 167,
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'prod-008',
    slug: 'altavoz-inteligente-echo-dot-reloj',
    name: 'Altavoz Inteligente Echo Dot con Reloj LED y Alexa',
    url: 'https://www.amazon.es/dp/B09B8W2?tag=giftblog-21',
    merchant: 'Amazon España',
    merchant_id: 'mch-amazon-es',
    image: 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=600&auto=format&fit=crop&q=80',
    price: '54,99 €',
    currency: 'EUR',
    description: 'Control por voz de música, temporizadores, alarmas e iluminación inteligente en toda la casa.',
    tags: ['hijo', 'hija', 'hermano', 'hermana', 'amigo', 'maestro', 'utiles', 'navidad', 'cumpleanos'],
    clicks: 133,
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'prod-009',
    slug: 'tarjeta-regalo-amazon-caja-lujo',
    name: 'Tarjeta Regalo Digital o en Caja Festiva (Importe Libre)',
    url: 'https://www.amazon.es/gift-cards?tag=giftblog-21',
    merchant: 'Amazon España',
    merchant_id: 'mch-amazon-es',
    image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=600&auto=format&fit=crop&q=80',
    price: '25,00 € - 200,00 €',
    currency: 'EUR',
    description: 'El salvavidas infalible de última hora: envío instantáneo por email o tarjeta física en estuche prémium.',
    tags: ['que-lo-tiene-todo', 'ultima-hora', 'cunada', 'cunado', 'suegra', 'suegro', 'amigo'],
    clicks: 295,
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: 'prod-010',
    slug: 'cuaderno-cuero-recargable-viajero',
    name: 'Cuaderno Diario de Cuero Vintage con Bolígrafo de Ébano',
    url: 'https://www.fnac.es/cuaderno-cuero?tag=fnac-es',
    merchant: 'Fnac España',
    merchant_id: 'mch-fnac-es',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    price: '28,50 €',
    currency: 'EUR',
    description: 'Papel kraft de alto gramaje para bocetos, reflexiones y notas de viaje. Acabado artesanal cosido a mano.',
    tags: ['maestra', 'maestro', 'papa', 'novio', 'amiga', 'sentimentales', 'utiles'],
    clicks: 88,
    active: true,
    created_at: now,
    updated_at: now,
  },
];

// Read existing db.json
let db = {};
if (fs.existsSync(DB_FILE)) {
  db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

db.catalog_urls = catalogUrls;
db.keywords = keywords;
db.merchants = merchants;

// Merge products: keep existing if any, add new ones if not present
const existingProds = db.products || [];
const prodMap = new Map();
for (const p of sampleProducts) prodMap.set(p.id, p);
for (const p of existingProds) {
  // ensure merchant_id if missing
  if (!p.merchant_id) p.merchant_id = 'mch-amazon-es';
  prodMap.set(p.id, p);
}
db.products = Array.from(prodMap.values());

fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
fs.writeFileSync(SEED_FILE, JSON.stringify(db, null, 2), 'utf8');

console.log('✅ Successfully seeded:');
console.log(`- ${catalogUrls.length} catalog_urls`);
console.log(`- ${keywords.length} keywords`);
console.log(`- ${merchants.length} merchants`);
console.log(`- ${db.products.length} products`);
