import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: posts } = await sb
    .from('posts')
    .select('slug, items')
    .in('slug', [
      'disfraces-halloween-perros-gatos-mascotas',
      'cestas-chuches-dulces-gourmet-halloween'
    ]);

  posts?.forEach(p => {
    console.log(`\n=== ${p.slug} ===`);
    console.log('Item 1:', JSON.stringify(p.items?.[0], null, 2));
    console.log('Item 2:', JSON.stringify(p.items?.[1], null, 2));
  });
}

main().catch(console.error);
