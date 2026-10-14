import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function testGo() {
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

  const testSlug = 'ideas-de-regalos-para-mama-item-1';
  console.log(`Testing click tracking for slug: "${testSlug}"`);

  // Check before
  const { data: before } = await sb.from('products').select('id, name, slug, clicks').eq('slug', testSlug).single();
  console.log('Product before:', before);

  // Increment clicks
  const { error: incErr } = await sb.rpc('increment_counter', { p_table: 'products', p_id: before.id, p_field: 'clicks' });
  console.log('RPC increment error:', incErr);

  // Check after
  const { data: after } = await sb.from('products').select('id, name, slug, clicks').eq('slug', testSlug).single();
  console.log('Product after click:', after);
}

testGo().catch(console.error);
