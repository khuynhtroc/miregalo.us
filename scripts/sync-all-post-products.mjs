import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function main() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const env = Object.fromEntries(
    envContent
      .split('\n')
      .filter((l) => l.includes('='))
      .map((l) => {
        const parts = l.trim().split('=');
        return [parts[0], parts.slice(1).join('=')];
      })
  );
  const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  const sb = createClient(url, key);

  console.log('--- SYNCING ALL POST ITEMS INTO PRODUCTS TABLE ---');

  // Fetch all posts with items
  let allPosts = [];
  let from = 0;
  const pageSize = 500;
  while (true) {
    const { data, error } = await sb
      .from('posts')
      .select('id, slug, title, items')
      .range(from, from + pageSize - 1);
    if (error) {
      console.error('Error fetching posts:', error);
      break;
    }
    if (!data || data.length === 0) break;
    allPosts.push(...data);
    from += pageSize;
    if (data.length < pageSize) break;
  }
  console.log(`Loaded ${allPosts.length} posts from Supabase.`);

  // Filter posts that have items
  const postsWithItems = allPosts.filter((p) => p.items && Array.isArray(p.items) && p.items.length > 0);
  console.log(`Posts with items: ${postsWithItems.length}`);

  // Fetch all existing product IDs / slugs in Supabase
  let existingProductKeys = new Set();
  from = 0;
  while (true) {
    const { data, error } = await sb
      .from('products')
      .select('id, slug')
      .range(from, from + pageSize - 1);
    if (error) {
      console.error('Error fetching products:', error);
      break;
    }
    if (!data || data.length === 0) break;
    data.forEach((p) => {
      if (p.id) existingProductKeys.add(p.id);
      if (p.slug) existingProductKeys.add(p.slug);
    });
    from += pageSize;
    if (data.length < pageSize) break;
  }
  console.log(`Found ${existingProductKeys.size} existing product keys in Supabase.`);

  const amazonTag = 'miregalo26-20';
  const now = new Date().toISOString();
  const toInsert = [];

  for (const post of postsWithItems) {
    post.items.forEach((item, idx) => {
      const itemNum = idx + 1;
      const cleanSlug = `${post.slug}-item-${itemNum}`;
      const prodId = `prod-${cleanSlug}`;

      if (!existingProductKeys.has(prodId) && !existingProductKeys.has(cleanSlug)) {
        const prodName = item.heading || `${post.title} #${itemNum}`;
        const prodUrl =
          item.url && item.url.startsWith('http') && !item.url.includes('#')
            ? item.url
            : `https://www.amazon.es/s?k=${encodeURIComponent(prodName.slice(0, 70))}&tag=${amazonTag}`;

        toInsert.push({
          id: prodId,
          slug: cleanSlug,
          name: prodName,
          url: prodUrl,
          merchant: item.merchant || 'Amazon España',
          image: item.image || 'https://media.miregalo.us/media/medium_necklace1_b337bcdf8b/medium_necklace1_b337bcdf8b.jpg',
          price: item.price || '29,99 €',
          currency: 'EUR',
          description: item.description_html || '<p>Producto recomendado para regalo.</p>',
          tags: ['regalos', 'destacado'],
          clicks: 0,
          active: true,
          created_at: now,
          updated_at: now,
        });
        existingProductKeys.add(prodId);
        existingProductKeys.add(cleanSlug);
      }
    });
  }

  console.log(`Total missing products to insert: ${toInsert.length}`);

  if (toInsert.length > 0) {
    const chunk = 200;
    for (let i = 0; i < toInsert.length; i += chunk) {
      const batch = toInsert.slice(i, i + chunk);
      const { error } = await sb.from('products').upsert(batch, { onConflict: 'id' });
      if (error) {
        console.error(`Error inserting batch ${i}:`, error.message);
      } else {
        console.log(`  Inserted batch ${i + 1} - ${i + batch.length}`);
      }
    }
  }

  // Also update local data/db.json if it exists
  try {
    if (fs.existsSync('data/db.json')) {
      const localDb = JSON.parse(fs.readFileSync('data/db.json', 'utf8'));
      if (Array.isArray(localDb.products)) {
        const localKeys = new Set(localDb.products.map((p) => p.id));
        let added = 0;
        toInsert.forEach((p) => {
          if (!localKeys.has(p.id)) {
            localDb.products.push(p);
            localKeys.add(p.id);
            added++;
          }
        });
        if (added > 0) {
          fs.writeFileSync('data/db.json', JSON.stringify(localDb, null, 2), 'utf8');
          console.log(`Added ${added} new products to local data/db.json.`);
        }
      }
    }
  } catch (err) {
    console.warn('Local db.json sync warning:', err);
  }

  console.log('🎉 SYNC COMPLETE!');
}

main().catch(console.error);
