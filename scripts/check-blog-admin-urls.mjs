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
    if (p.content_html.includes('blog-admin.loveable.ai')) {
      console.log('Post:', p.slug);
      const m = p.content_html.match(/[^\s"'<>]*blog-admin\.loveable\.ai[^\s"'<>]*/g);
      console.log('Matches:', m);
    }
  });
}

run();
