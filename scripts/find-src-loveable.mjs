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
    const imgTags = p.content_html.match(/<img[^>]+>/gi) || [];
    imgTags.forEach(tag => {
      const srcMatch = tag.match(/src=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1].includes('loveable')) {
        console.log('Post:', p.slug);
        console.log('Img Tag:', tag);
      }
    });
  });
}

run();
