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
  const { data: p } = await sb
    .from('posts')
    .select('id, slug, title, excerpt, intro_html, content_html, items')
    .eq('slug', 'regalos-halloween-para-adultos-ideas')
    .single();

  console.log('=== POST 1 ===');
  console.log('Title:', p.title);
  console.log('Excerpt:', p.excerpt);
  console.log('\n--- INTRO HTML ---');
  console.log(p.intro_html);
  console.log('\n--- FIRST 500 CHARS OF CONTENT HTML ---');
  console.log(p.content_html?.substring(0, 500));
  console.log('\n--- LAST 500 CHARS OF CONTENT HTML ---');
  console.log(p.content_html?.substring(p.content_html.length - 500));
}

main().catch(console.error);
