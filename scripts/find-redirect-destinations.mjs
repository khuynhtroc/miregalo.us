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
  const deadRedirects = [
    { src: '/valentines-day-gifts-for-him/', dest: '/regalos-san-valentin-para-el/', kw: 'san valentin' },
    { src: '/valentines-day-gifts-for-her/', dest: '/regalos-san-valentin-para-ella/', kw: 'san valentin' },
    { src: '/fathers-day-gifts/', dest: '/regalos-dia-del-padre-espana/', kw: 'padre' },
    { src: '/wedding-gift-ideas/', dest: '/regalos-boda-novios/', kw: 'boda' },
    { src: '/graduation-gifts/', dest: '/regalos-graduacion-academicos/', kw: 'graduacion' },
    { src: '/gifts-for-nature-lovers/', dest: '/regalos-amantes-naturaleza-deporte/', kw: 'naturaleza' },
    { src: '/sample-christmas-gifts/', dest: '/regalos-navidad-familia/', kw: 'navidad' },
  ];

  console.log('=== TÌM DESTINATION THÍCH HỢP CHO 7 DEAD REDIRECTS ===\n');

  for (const item of deadRedirects) {
    console.log(`Kiểm tra cho: ${item.src} (hiện trỏ 404: ${item.dest})`);
    
    // Check categories
    const { data: cats } = await sb.from('categories').select('id, name, slug').ilike('slug', `%${item.kw}%`);
    if (cats && cats.length) {
      console.log('  -> Categories phù hợp:', cats.map(c => `/${c.slug}/ (${c.name})`));
    }

    // Check catalog_urls
    const { data: curls } = await sb.from('catalog_urls').select('url, page_title').ilike('url', `%${item.kw}%`);
    if (curls && curls.length) {
      console.log('  -> Catalog URLs phù hợp:', curls.map(c => `${c.url} (${c.page_title})`));
    }

    // Check top matching posts
    const { data: posts } = await sb.from('posts').select('id, slug, title, status').eq('status', 'published').ilike('slug', `%${item.kw}%`).limit(3);
    if (posts && posts.length) {
      console.log('  -> Posts phù hợp:', posts.map(p => `/${p.slug}/`));
    }
    console.log('');
  }
}

main().catch(console.error);
