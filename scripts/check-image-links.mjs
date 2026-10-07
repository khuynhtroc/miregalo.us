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

  let imageLinkMatches = [];

  posts.forEach(p => {
    if (!p.content_html) return;
    const aTags = p.content_html.match(/<a[^>]+href=["']([^"']+)["'][^>]*>/gi) || [];
    aTags.forEach(tag => {
      const m = tag.match(/href=["']([^"']+)["']/i);
      if (m) {
        const href = m[1];
        if (href.includes('loveable') && (href.endsWith('.jpg') || href.endsWith('.png') || href.endsWith('.jpeg') || href.endsWith('.webp') || href.endsWith('.gif') || href.includes('storage.googleapis.com'))) {
          imageLinkMatches.push({ slug: p.slug, href });
        }
      }
    });
  });

  console.log('Total <a> href pointing to loveable images:', imageLinkMatches.length);
  imageLinkMatches.slice(0, 10).forEach(x => console.log(`- [${x.slug}] ${x.href}`));
}

run();
