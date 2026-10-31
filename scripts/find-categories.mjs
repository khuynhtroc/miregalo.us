import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function findCats() {
  const { data: cats } = await sb.from('categories').select('id, slug, name, hero_image');
  cats?.forEach(c => console.log(`${c.slug} -> ID: ${c.id} | Name: ${c.name} | Hero: ${c.hero_image}`));
}
findCats().catch(console.error);
