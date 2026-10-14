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

  console.log('=== Checking Top Clicked Products ===');
  const { data: topProds } = await sb
    .from('products')
    .select('id, name, slug, clicks, merchant')
    .order('clicks', { ascending: false })
    .limit(10);
  console.log('Top products by clicks:', topProds);

  console.log('\n=== Triggering live click on item 3 ===');
  const liveUrl = 'https://www.miregalo.us/go/ideas-de-regalos-para-mama-item-3/';
  const res = await fetch(liveUrl, {
    redirect: 'manual',
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  console.log('Fetch item-3 status:', res.status, 'Location:', res.headers.get('location'));

  // wait 1 sec
  await new Promise(r => setTimeout(r, 1000));

  console.log('\n=== Checking items 1, 2, 3 in products ===');
  const { data: items } = await sb
    .from('products')
    .select('id, name, slug, clicks')
    .in('slug', [
      'ideas-de-regalos-para-mama-item-1',
      'ideas-de-regalos-para-mama-item-2',
      'ideas-de-regalos-para-mama-item-3'
    ]);
  console.log('Specific items:', items);
}

main().catch(console.error);
