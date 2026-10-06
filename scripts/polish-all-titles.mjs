import fs from 'fs';

const DB_FILE = 'data/db.json';
const SEED_FILE = 'data/seed.json';
const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

async function translateTitle(text) {
  if (!text || !text.trim()) return text;
  const url = 'https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=es&q=' + encodeURIComponent(text.trim());
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const data = await res.json();
    return Array.isArray(data) ? data[0] : data;
  } catch {
    return text;
  }
}

async function main() {
  console.log('Polishing and ensuring 100% Spanish titles for all posts...');
  
  // Find posts where title has English words
  const englishRegex = /\b(best|gifts?|for|him|her|quotes?|wishes|ideas|anniversary|birthday|wedding|daughter|son|mom|dad|couples?|year|month|old|heartfelt)\b/i;
  
  const needTranslation = db.posts.filter(p => p.type !== 'page' && englishRegex.test(p.title));
  console.log(`Found ${needTranslation.length} posts needing title translation to Spanish.`);

  // Batch translate in parallel with concurrency 10
  const queue = [...needTranslation];
  let done = 0;
  async function worker() {
    while (queue.length > 0) {
      const p = queue.shift();
      if (!p) break;
      const trans = await translateTitle(p.title);
      p.title = trans;
      p.hero_alt = trans;
      done++;
      if (done % 25 === 0 || queue.length === 0) {
        console.log(`[${done}/${needTranslation.length}] Translated titles...`);
      }
    }
  }

  const workers = Array.from({ length: 10 }, () => worker());
  await Promise.all(workers);

  // Also check products whose name might still be English
  console.log('Polishing product names...');
  let prodDone = 0;
  const englishProdRegex = /\b(shirt|mug|plaque|necklace|watch|keychain|blanket|canvas|gift|box|ring|bracelet|frame|apron)\b/i;
  const prodsNeed = db.products.filter(p => englishProdRegex.test(p.name));
  console.log(`Found ${prodsNeed.length} products needing name translation.`);

  const prodQueue = [...prodsNeed];
  async function prodWorker() {
    while (prodQueue.length > 0) {
      const p = prodQueue.shift();
      if (!p) break;
      p.name = await translateTitle(p.name);
      prodDone++;
      if (prodDone % 100 === 0 || prodQueue.length === 0) {
        console.log(`[${prodDone}/${prodsNeed.length}] Translated product names...`);
      }
    }
  }
  const prodWorkers = Array.from({ length: 15 }, () => prodWorker());
  await Promise.all(prodWorkers);

  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  fs.writeFileSync(SEED_FILE, JSON.stringify(db, null, 2), 'utf8');
  console.log('✅ Polishing complete! Updated db.json and seed.json.');
}

main().catch(console.error);
