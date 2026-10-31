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
  const { data: posts, error } = await sb
    .from('posts')
    .select('id, slug, title, focus_keyword, excerpt, published_at')
    .eq('status', 'planned')
    .order('published_at', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`TOTAL PLANNED: ${posts.length}\n`);
  posts.forEach((p, i) => {
    console.log(`${i + 1}. [${p.slug}]`);
    console.log(`   Title: ${p.title}`);
    console.log(`   KW: ${p.focus_keyword}`);
    console.log(`   Published At: ${p.published_at}`);
  });
}

main().catch(console.error);
