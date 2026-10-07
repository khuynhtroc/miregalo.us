import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: post } = await supabase
    .from('posts')
    .select('id, slug, hero_image, content_html')
    .eq('slug', 'regalos-impressive-first-date-locations')
    .single();

  console.log('Post ID:', post.id);
  console.log('Slug:', post.slug);
  console.log('Hero Image:', post.hero_image);
  console.log('Has loveable in content_html:', post.content_html.includes('loveable'));
  console.log('Has srcset in content_html:', post.content_html.includes('srcset='));

  const imgs = post.content_html.match(/<img[^>]+>/gi) || [];
  console.log(`\nTotal images in this post: ${imgs.length}`);
  imgs.forEach((tag, idx) => {
    console.log(`\nImage #${idx + 1}:`);
    console.log(tag);
  });
}

run();
