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
  const { data: posts } = await supabase.from('posts').select('id, slug, content_html').ilike('content_html', '%loveable0420-20%');
  console.log('Posts with loveable0420-20:', posts ? posts.length : 0);
  if (posts) {
    for (const p of posts) {
      const cleaned = p.content_html.replace(/tag=loveable0420-20/g, 'tag=miregalo-20');
      await supabase.from('posts').update({ content_html: cleaned }).eq('id', p.id);
      console.log('Cleaned post:', p.slug);
    }
  }
}

run();
