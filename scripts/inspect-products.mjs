import { createClient } from '@supabase/supabase-js';

const url = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(url, key);

async function main() {
  const { data: prods, count, error } = await sb
    .from('products')
    .select('id, name, slug, price, clicks, url, merchant', { count: 'exact' })
    .order('clicks', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching products:', error);
    return;
  }

  console.log(`Total products in Supabase: ${count}`);
  console.log('Top 15 products by clicks:');
  console.table(prods.slice(0, 15).map(p => ({
    name: p.name ? p.name.slice(0, 30) : '',
    price: p.price,
    clicks: p.clicks,
    merchant: p.merchant ? p.merchant.slice(0, 20) : '',
  })));

  // Check distinct prices
  const { data: samplePrices } = await sb
    .from('products')
    .select('price')
    .limit(200);

  const priceSet = new Set(samplePrices.map(p => p.price));
  console.log('Sample distinct prices:', Array.from(priceSet));
}

main();
