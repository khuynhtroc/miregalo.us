import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data } = await sb.from('posts').select('title, content_html').eq('slug', 'regalos-10th-aniversario-ideas').single();
  console.log('Post Title:', data.title);
  const imgs = data.content_html?.match(/<img[^>]+>/gi) || [];
  console.log('Number of images in content_html:', imgs.length);
  imgs.forEach((img, i) => console.log((i + 1) + '.', img.slice(0, 160)));

  const idx = data.content_html.indexOf('lh6.googleusercontent.com');
  if (idx !== -1) {
    console.log('\n--- Ngữ cảnh xung quanh google image ---');
    console.log(data.content_html.slice(Math.max(0, idx - 200), idx + 350));
  }
}

main().catch(console.error);
