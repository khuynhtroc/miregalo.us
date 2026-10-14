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

  console.log('=== Checking post: ideas-de-regalos-para-mama ===');
  const { data: p } = await sb.from('posts').select('id, slug, title, items').eq('slug', 'ideas-de-regalos-para-mama').single();
  console.log('Post Title:', p?.title);
  console.log('Post Items count:', p?.items?.length);
  p?.items?.forEach((item, idx) => {
    console.log(`  #${idx + 1}: [${item.heading}] -> url: "${item.url}"`);
  });

  console.log('\n=== Checking products table for ideas-de-regalos-para-mama ===');
  const { data: prods } = await sb.from('products').select('*').ilike('slug', '%ideas-de-regalos-para-mama%');
  console.log('Found in products table:', prods?.length);

  console.log('\n=== Checking products table for "Auriculares" or "Nespresso" ===');
  const { data: sampleSearch } = await sb.from('products').select('id, slug, name, clicks, url').ilike('name', '%Nespresso%');
  console.log('Nespresso products in products table:', sampleSearch);

  console.log('\n=== Checking total products and clicks distribution in products table ===');
  const { count: totalProds } = await sb.from('products').select('*', { count: 'exact', head: true });
  const { count: prodsWithClicks } = await sb.from('products').select('*', { count: 'exact', head: true }).gt('clicks', 0);
  console.log(`Total products: ${totalProds} | Products with clicks > 0: ${prodsWithClicks}`);

  console.log('\n=== Checking /admin products API output ===');
  const { data: allProds } = await sb.from('products').select('id, name, slug, clicks, merchant_id').limit(20);
  console.log('Sample 5 products in DB:');
  allProds?.slice(0, 5).forEach((prod) => console.log(prod));
}

main().catch(console.error);
