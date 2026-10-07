import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('Fetching all posts from Supabase...');
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, slug, hero_image, items, content_html');

  if (error) {
    console.error('Error fetching posts:', error);
    return;
  }

  let heroLoveable = [];
  let itemsLoveable = [];
  let contentLoveable = [];
  let contentSrcsetLoveable = [];
  let loveableUrlsSet = new Set();

  posts.forEach(p => {
    if (p.hero_image && p.hero_image.includes('loveable')) {
      heroLoveable.push({ id: p.id, slug: p.slug, hero: p.hero_image });
      loveableUrlsSet.add(p.hero_image);
    }
    if (p.items) {
      const itemsStr = JSON.stringify(p.items);
      if (itemsStr.includes('loveable')) {
        itemsLoveable.push({ id: p.id, slug: p.slug });
        // extract urls
        const matches = itemsStr.match(/https?:\/\/[^\s"'\\]*loveable[^\s"'\\]*/g) || [];
        matches.forEach(u => loveableUrlsSet.add(u));
      }
    }
    if (p.content_html && p.content_html.includes('loveable')) {
      contentLoveable.push({ id: p.id, slug: p.slug });
      const matches = p.content_html.match(/https?:\/\/[^\s"'<>\\]*loveable[^\s"'<>\\]*/g) || [];
      matches.forEach(u => loveableUrlsSet.add(u));
      if (p.content_html.includes('srcset=') && (p.content_html.includes('loveable.appspot.com') || p.content_html.includes('loveable.ai') || p.content_html.includes('loveable.us'))) {
        contentSrcsetLoveable.push({ id: p.id, slug: p.slug });
      }
    }
  });

  console.log('--- SCAN RESULTS ---');
  console.log('Total posts in DB:', posts.length);
  console.log('Posts with loveable in hero_image:', heroLoveable.length);
  console.log('Posts with loveable in items:', itemsLoveable.length);
  console.log('Posts with loveable in content_html:', contentLoveable.length);
  console.log('Posts with loveable in srcset:', contentSrcsetLoveable.length);
  console.log('Total unique loveable URLs found:', loveableUrlsSet.size);

  const sampleUrls = Array.from(loveableUrlsSet).slice(0, 15);
  console.log('\nSample loveable URLs:');
  sampleUrls.forEach(u => console.log(' -', u));

  // Check categories, merchants, affiliate_links, etc.
  const { data: categories } = await supabase.from('categories').select('id, slug, image');
  const catLoveable = (categories || []).filter(c => c.image && c.image.includes('loveable'));
  console.log('Categories with loveable image:', catLoveable.length);

  const { data: merchants } = await supabase.from('merchants').select('id, slug, logo_url');
  const merchLoveable = (merchants || []).filter(m => m.logo_url && m.logo_url.includes('loveable'));
  console.log('Merchants with loveable logo:', merchLoveable.length);

  const { data: products } = await supabase.from('products').select('id, slug, image_url');
  const prodLoveable = (products || []).filter(p => p.image_url && p.image_url.includes('loveable'));
  console.log('Products with loveable image:', prodLoveable.length);
}

run();
