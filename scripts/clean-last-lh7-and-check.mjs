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
  const { data: posts } = await supabase.from('posts').select('id, slug, content_html');

  posts.forEach(p => {
    if (!p.content_html) return;
    const m = p.content_html.match(/https?:\/\/[^\s"'<>\\]*loveable[^\s"'<>\\]*/gi);
    if (m && m.length > 0) {
      console.log(`[${p.slug}] matches:`, m);
    }
  });

  // Remove the 1 lh7 image from regalos-divertidos-navipapa-card-ideas
  const { data: cardPost } = await supabase
    .from('posts')
    .select('id, slug, content_html')
    .eq('slug', 'regalos-divertidos-navipapa-card-ideas')
    .single();

  if (cardPost && cardPost.content_html) {
    const cleaned = cardPost.content_html.replace(/<figure[^>]*>[\s\S]*?lh7-us\.googleusercontent\.com[\s\S]*?<\/figure>/gi, '')
      .replace(/<img[^>]+lh7-us\.googleusercontent\.com[^>]*>/gi, '');
    await supabase.from('posts').update({ content_html: cleaned }).eq('id', cardPost.id);
    console.log('✅ Cleaned remaining lh7 image in regalos-divertidos-navipapa-card-ideas');
  }
}

run();
