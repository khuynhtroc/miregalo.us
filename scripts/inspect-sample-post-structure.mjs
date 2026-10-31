import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectSample() {
  const { data: post, error } = await sb.from('posts').select('*').eq('slug', 'regalos-divertidos-para-papa').single();
  if (error || !post) {
    console.error('Error:', error);
    return;
  }
  console.log('Sample post structure:');
  console.log('ID:', post.id);
  console.log('Slug:', post.slug);
  console.log('Title:', post.title);
  console.log('Type:', post.type);
  console.log('Primary category:', post.primary_category_id);
  console.log('Category IDs:', post.category_ids);
  console.log('Author ID:', post.author_id);
  console.log('Hero image:', post.hero_image);
  console.log('Items count:', post.items?.length);
  console.log('First item:', JSON.stringify(post.items?.[0], null, 2));
  console.log('Faqs count:', post.faqs?.length);
  console.log('Faq 1:', JSON.stringify(post.faqs?.[0], null, 2));
  console.log('Excerpt:', post.excerpt);
  console.log('Intro HTML snippet:', post.intro_html?.slice(0, 150));
  console.log('Content HTML snippet:', post.content_html?.slice(0, 150));
}
inspectSample().catch(console.error);
