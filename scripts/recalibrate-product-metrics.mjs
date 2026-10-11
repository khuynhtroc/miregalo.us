import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const url = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(url, key);

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');
const SEED_PATH = path.join(process.cwd(), 'data', 'seed.json');

const POST_COLS = [
  'id', 'type', 'slug', 'title', 'excerpt', 'intro_html', 'content_html',
  'items', 'faqs', 'hero_image', 'hero_alt', 'primary_category_id',
  'category_ids', 'author_id', 'status', 'featured', 'editor_pick',
  'focus_keyword', 'seo_title', 'seo_description', 'canonical_url',
  'robots', 'og_image', 'published_at', 'created_at', 'updated_at'
];

const PRODUCT_COLS = [
  'id', 'slug', 'name', 'url', 'merchant', 'image', 'price', 'currency',
  'description', 'tags', 'clicks', 'active', 'created_at', 'updated_at'
];

function pick(obj, keys) {
  const res = {};
  for (const k of keys) {
    if (obj[k] !== undefined) res[k] = obj[k];
  }
  return res;
}

function pickStable(str, arr) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % arr.length;
  return arr[idx];
}

export function generateRealisticPrice(name, id = '') {
  const lower = (name || '').toLowerCase();

  // 1. Small trinkets, keychains, socks, badges, pins, stationery, bookmarks
  if (/llavero|calcetin|pegatina|chapa|marcapáginas|bolígrafo|imán|jabón|pin|parche|carrete|insignia|cordón|abridor|posavasos|bálsamo|pastillero|peine|percha/i.test(lower)) {
    const list = ['8,99 €', '9,95 €', '10,90 €', '11,95 €', '12,50 €', '13,90 €', '14,50 €'];
    return pickStable(id + name, list);
  }

  // 2. Mugs, drinkware, tumblers, water bottles, small timers
  if (/taza|termo|vaso|copa|botella|jarra|infusor|cantimplora|mug|temporizador/i.test(lower)) {
    const list = ['14,95 €', '15,90 €', '16,95 €', '18,50 €', '19,95 €', '21,90 €', '22,50 €'];
    return pickStable(id + name, list);
  }

  // 3. Small sweets, chocolates, candies
  if (/bombones|dulces|caramelos|golosinas|chocolatinas|galletas/i.test(lower)) {
    const list = ['12,90 €', '14,50 €', '16,90 €', '18,50 €', '19,95 €'];
    return pickStable(id + name, list);
  }

  // 4. Bath, spa, candles, skincare, cosmetics
  if (/vela|velas|aromática|difusor|sales de baño|bomba de baño|champú|crema|loción|afeitado|barba|mascarilla|spa/i.test(lower)) {
    const list = ['16,90 €', '18,50 €', '21,90 €', '24,50 €', '26,90 €', '29,90 €'];
    return pickStable(id + name, list);
  }

  // 5. Apparel, T-shirts, caps, aprons, scarves, hats
  if (/camiseta|gorra|delantal|gorro|bufanda|guantes|sombrero|pañuelo|corbata/i.test(lower)) {
    const list = ['18,95 €', '19,95 €', '21,90 €', '22,95 €', '24,50 €', '26,90 €'];
    return pickStable(id + name, list);
  }

  // 6. Sweatshirts, hoodies, bathrobes, sweaters, pyjamas
  if (/sudadera|jersey|albornoz|bata|pijama|chaqueta|suéter/i.test(lower)) {
    const list = ['34,95 €', '37,90 €', '39,99 €', '42,50 €', '45,90 €', '49,95 €'];
    return pickStable(id + name, list);
  }

  // 7. Blankets, pillows, wall art, lamps, home decor
  if (/manta|cojín|almohada|póster|cuadro|lienzo|lámina|lámpara|luz nocturna|reloj de pared|felpudo|marco/i.test(lower)) {
    const list = ['25,90 €', '28,50 €', '32,90 €', '34,95 €', '36,90 €', '39,99 €', '44,50 €'];
    return pickStable(id + name, list);
  }

  // 8. Jewelry, watches, leather wallets, handbags, belts
  if (/collar|pulsera|anillo|pendientes|joya|reloj|cartera|billetera|bolso|mochila|neceser|cinturón|gemelos|colgante|brazalete/i.test(lower)) {
    const list = ['28,90 €', '32,50 €', '36,90 €', '42,00 €', '46,50 €', '52,90 €', '58,00 €'];
    return pickStable(id + name, list);
  }

  // 9. Gourmet hampers, gift baskets, wine packs, tasting kits
  if (/caja|cesta|pack|kit|lote|vino|cerveza|degustación|gourmet|delicatessen|jamón|queso/i.test(lower)) {
    const list = ['34,90 €', '38,50 €', '42,90 €', '47,50 €', '52,90 €', '59,00 €', '68,50 €'];
    return pickStable(id + name, list);
  }

  // 10. Tech, speakers, electronics, massagers, chargers
  if (/altavoz|auriculares|masajeador|inalámbrico|bluetooth|cargador|gadget|proyector|teclado|smartwatch/i.test(lower)) {
    const list = ['39,95 €', '45,00 €', '49,99 €', '56,90 €', '64,95 €', '74,90 €', '89,00 €'];
    return pickStable(id + name, list);
  }

  // 11. Books, novels, guides, board games, puzzles
  if (/libro|novela|guía|juego|puzzle|baraja|tablero|rompecabezas|manualidades/i.test(lower)) {
    const list = ['15,90 €', '17,50 €', '19,95 €', '22,90 €', '24,50 €', '27,90 €'];
    return pickStable(id + name, list);
  }

  // 12. General realistic gift fallback
  const fallback = ['16,95 €', '19,90 €', '22,50 €', '24,95 €', '27,90 €', '29,95 €', '32,50 €', '35,00 €', '38,90 €', '42,00 €', '45,90 €'];
  return pickStable(id + name, fallback);
}

async function run() {
  console.log('🔄 Loading local database...');
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

  console.log(`📦 Found ${db.products?.length || 0} products and ${db.posts?.length || 0} posts.`);

  // 1. Recalibrate product prices
  const productPriceMap = new Map();
  let updatedProductsCount = 0;

  for (const prod of (db.products || [])) {
    const newPrice = generateRealisticPrice(prod.name, prod.id);
    prod.price = newPrice;
    productPriceMap.set(prod.id, newPrice);
    if (prod.slug) productPriceMap.set(prod.slug, newPrice);
    if (prod.slug) productPriceMap.set(`prod-${prod.slug}`, newPrice);
    updatedProductsCount++;
  }

  // 2. Recalibrate post items
  let updatedItemsCount = 0;
  for (const post of (db.posts || [])) {
    if (!Array.isArray(post.items)) continue;
    for (const item of post.items) {
      let matchedPrice = null;
      if (item.product_id && productPriceMap.has(item.product_id)) {
        matchedPrice = productPriceMap.get(item.product_id);
      } else if (item.url && item.url.startsWith('/go/')) {
        const itemSlug = item.url.replace(/^\/go\//, '').replace(/\/$/, '');
        matchedPrice = productPriceMap.get(itemSlug) || productPriceMap.get(`prod-${itemSlug}`);
      }

      if (!matchedPrice) {
        matchedPrice = generateRealisticPrice(item.heading, item.product_id || item.url || '');
      }

      item.price = matchedPrice;
      updatedItemsCount++;
    }
  }

  console.log(`✅ Recalibrated ${updatedProductsCount} products and ${updatedItemsCount} post items locally.`);

  // Save local DB
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  if (fs.existsSync(SEED_PATH)) {
    fs.writeFileSync(SEED_PATH, JSON.stringify(db, null, 2), 'utf8');
  }
  console.log('💾 Persisted updated data to data/db.json and data/seed.json.');

  // 3. Sync to Supabase
  console.log('\n🚀 Synchronizing updated prices to Supabase...');

  // 3a. Update Supabase products table first (in batches of 300)
  console.log(`\nUpdating Supabase products table in batches of 300...`);
  const prodChunkSize = 300;
  const now = new Date().toISOString();

  // Filter products to the ones present in Supabase (first 36,000)
  const prodsToUpsert = (db.products || []).slice(0, 36000).map(p => {
    const row = {
      id: p.id,
      slug: p.slug,
      name: p.name,
      url: p.url || '',
      merchant: p.merchant || 'Amazon España',
      image: p.image || '',
      price: p.price,
      currency: p.currency || 'EUR',
      description: p.description || '',
      tags: Array.isArray(p.tags) ? p.tags : [],
      clicks: typeof p.clicks === 'number' ? p.clicks : 0,
      active: p.active !== false,
      created_at: p.created_at || now,
      updated_at: now
    };
    return pick(row, PRODUCT_COLS);
  });

  const prodChunks = [];
  for (let i = 0; i < prodsToUpsert.length; i += prodChunkSize) {
    prodChunks.push(prodsToUpsert.slice(i, i + prodChunkSize));
  }

  let prodSuccess = 0;
  for (let i = 0; i < prodChunks.length; i++) {
    const chunk = prodChunks[i];
    const { error } = await sb.from('products').upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error(`Error updating product batch ${i + 1}/${prodChunks.length}:`, error.message);
    } else {
      prodSuccess += chunk.length;
    }
    if ((i + 1) % 15 === 0 || i === prodChunks.length - 1) {
      console.log(`  Products progress: ${prodSuccess}/${prodsToUpsert.length}`);
    }
  }

  // 3b. Update Supabase posts (in batches of 25 with full picked fields)
  console.log(`\nUpdating ${db.posts.length} posts in Supabase in batches of 25...`);
  const postChunks = [];
  const postChunkSize = 25;
  for (let i = 0; i < db.posts.length; i += postChunkSize) {
    postChunks.push(db.posts.slice(i, i + postChunkSize));
  }

  let postSuccess = 0;
  for (let i = 0; i < postChunks.length; i++) {
    const chunk = postChunks[i].map(p => {
      const row = {
        ...p,
        items: p.items || [],
        updated_at: now
      };
      return pick(row, POST_COLS);
    });

    const { error } = await sb.from('posts').upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error(`Error updating post batch ${i + 1}/${postChunks.length}:`, error.message);
    } else {
      postSuccess += chunk.length;
    }
    if ((i + 1) % 10 === 0 || i === postChunks.length - 1) {
      console.log(`  Posts progress: ${postSuccess}/${db.posts.length}`);
    }
  }

  console.log(`\n🎉 Completed recalibration! Total products synced: ${prodSuccess}, Total posts synced: ${postSuccess}`);
}

run().catch(console.error);
