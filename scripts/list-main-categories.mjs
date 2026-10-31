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
  const { data: cats } = await sb.from('categories').select('id, name, slug, group').order('name');
  const { data: curls } = await sb.from('catalog_urls').select('url, page_title, url_type, priority').order('priority');

  console.log('=== CATEGORIES ===');
  cats?.forEach(c => console.log(`- https://www.miregalo.us/${c.slug}/ [${c.name}] (${c.group})`));

  console.log('\n=== CATALOG URLS P1 ===');
  curls?.filter(u => u.priority === 'P1').forEach(u => console.log(`- https://www.miregalo.us${u.url} [${u.page_title}] (${u.url_type})`));
}

main().catch(console.error);
