import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTargets() {
  const { data: cat1 } = await sb.from('categories').select('id, slug, name').eq('slug', 'para-novia');
  console.log('Category para-novia:', cat1);

  const { data: p2 } = await sb.from('posts').select('id, slug, title, status').ilike('slug', '%para-novia%');
  console.log('\nPosts matching %para-novia%:', p2?.map(p => ({ slug: p.slug, title: p.title })));

  const { data: p3 } = await sb.from('posts').select('id, slug, title, status').ilike('slug', '%para-papa%');
  console.log('\nPosts matching %para-papa%:', p3?.map(p => ({ slug: p.slug, title: p.title })));
}
checkTargets().catch(console.error);
