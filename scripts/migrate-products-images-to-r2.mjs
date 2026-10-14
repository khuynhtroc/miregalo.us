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

  console.log('--- REPLACING LOVEABLE STORAGE URLS IN PRODUCTS TABLE ---');

  const pageSize = 1000;
  let updatedCount = 0;

  while (true) {
    // Fetch products that still have loveable.appspot.com in image
    const { data: rows, error } = await sb
      .from('products')
      .select('id, image')
      .like('image', '%loveable.appspot.com%')
      .limit(pageSize);

    if (error) {
      console.error('Error querying products:', error);
      break;
    }

    if (!rows || rows.length === 0) {
      console.log('No more products with loveable.appspot.com found!');
      break;
    }

    console.log(`Processing batch of ${rows.length} products...`);

    // Perform updates in parallel chunks of 50
    const chunkSize = 50;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map((p) => {
          const newImage = p.image
            .replace(/https?:\/\/storage\.googleapis\.com\/loveable\.appspot\.com\//gi, 'https://media.miregalo.us/media/')
            .replace(/https?:\/\/loveable\.appspot\.com\//gi, 'https://media.miregalo.us/media/');
          return sb.from('products').update({ image: newImage }).eq('id', p.id);
        })
      );
      updatedCount += chunk.length;
    }

    console.log(`Total updated so far: ${updatedCount}`);
    if (updatedCount >= 3000) {
      // Let background script finish or do 3000 at a time
      break;
    }
  }

  console.log(`Finished updating ${updatedCount} products in database.`);
}

main().catch(console.error);
