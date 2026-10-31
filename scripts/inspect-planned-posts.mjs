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
  const { data: posts } = await sb.from('posts').select('id, slug, title, status, intro_html, content_html, items, published_at').eq('status', 'planned').limit(5);
  posts?.forEach(p => {
    console.log('--- POST:', p.slug, '---');
    console.log('Title:', p.title);
    console.log('Published At:', p.published_at);
    console.log('Intro length:', p.intro_html?.length || 0);
    console.log('Content length:', p.content_html?.length || 0);
    console.log('Items count:', p.items?.length || 0);
    console.log('Intro snippet:', p.intro_html?.slice(0, 150));
  });
}

main().catch(console.error);
