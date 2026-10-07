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

  const nonR2List = [];
  posts.forEach(p => {
    if (!p.content_html) return;
    const imgs = p.content_html.match(/<img[^>]+src=["']([^"']+)["']/gi) || [];
    imgs.forEach(tag => {
      const m = tag.match(/src=["']([^"']+)["']/i);
      if (m && !m[1].startsWith('https://media.miregalo.us')) {
        nonR2List.push({ slug: p.slug, src: m[1] });
      }
    });
  });

  console.log('Total non-R2 img src:', nonR2List.length);
  const hostMap = {};
  nonR2List.forEach(x => {
    try {
      const u = new URL(x.src);
      hostMap[u.hostname] = (hostMap[u.hostname] || 0) + 1;
    } catch {
      hostMap['invalid'] = (hostMap['invalid'] || 0) + 1;
    }
  });
  console.log('Host breakdown:', hostMap);
  console.log('Samples:');
  nonR2List.slice(0, 10).forEach(x => console.log(`- [${x.slug}] ${x.src}`));
}

run();
