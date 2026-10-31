import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSlugs() {
  const checkList = [
    'regalos-utiles-para-novia',
    'ideas-de-regalos-para-novia',
    'regalos-para-papa-que-lo-tiene-todo'
  ];
  const { data: posts } = await sb.from('posts').select('id, slug, title').in('slug', checkList);
  console.log('Existing posts matching target slugs:', posts);
}
checkSlugs().catch(console.error);
