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
    .select('id, slug, title, focus_keyword, content_html')
    .eq('status', 'planned')
    .limit(6);

  posts?.forEach((p, i) => {
    console.log(`\n=== [${i+1}] ${p.slug} ===`);
    console.log('Keyword:', p.focus_keyword);
    // Find first h2 and first paragraph
    const firstH2 = p.content_html?.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1] || 'No H2';
    const firstP = p.content_html?.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] || 'No P';
    console.log('First H2:', firstH2);
    console.log('First P snippet:', firstP.substring(0, 150));
  });
}

main().catch(console.error);
