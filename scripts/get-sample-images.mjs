import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function getSampleImages() {
  const { data: posts } = await sb
    .from('posts')
    .select('slug, items')
    .in('slug', ['regalos-personalizados-para-novia', 'regalos-sentimentales-para-novia', 'regalos-divertidos-para-papa'])
    .limit(3);

  posts?.forEach(p => {
    console.log(`\n=== Images in ${p.slug} ===`);
    p.items?.slice(0, 5).forEach((it, idx) => {
      console.log(`  ${idx + 1}. [${it.heading}] -> ${it.image}`);
    });
  });
}

getSampleImages().catch(console.error);
