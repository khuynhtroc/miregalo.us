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
  console.log('=== VERIFYING FINAL POST STATUSES ===\n');

  // Check planned
  const { data: planned, count: pCount } = await sb.from('posts').select('id, slug', { count: 'exact' }).eq('status', 'planned');
  console.log('1. Remaining planned posts:', pCount || 0);

  // Check published
  const { count: pubCount } = await sb.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'published');
  console.log('2. Total published posts in database:', pubCount);

  // Sample check on 5 rewritten posts
  const sampleSlugs = [
    'regalos-halloween-para-adultos-ideas',
    'disfraces-halloween-perros-gatos-mascotas',
    'disfraces-halloween-gemelos-hermanos',
    'capas-terciopelo-accesorios-brujeria-halloween',
    'joyas-goticas-colgantes-halloween'
  ];

  console.log('\n3. Kiểm tra mẫu 5 bài vừa viết lại:');
  for (const s of sampleSlugs) {
    const { data: p } = await sb.from('posts').select('slug, title, excerpt, intro_html, items').eq('slug', s).single();
    const firstP = p.intro_html?.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] || '';
    const item1 = p.items?.[0]?.heading;
    console.log(`- /${p.slug}/:`);
    console.log(`  Title: ${p.title}`);
    console.log(`  Excerpt: ${p.excerpt}`);
    console.log(`  Intro P1: "${firstP.substring(0, 100)}..."`);
    console.log(`  Product 1: "${item1}"`);
    console.log('');
  }
}

main().catch(console.error);
