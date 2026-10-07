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

  const srcDomains = {};
  let totalImgs = 0;
  const nonR2Imgs = [];

  posts.forEach(p => {
    if (!p.content_html) return;
    const imgMatches = p.content_html.match(/<img[^>]+src=["']([^"']+)["']/gi) || [];
    imgMatches.forEach(tag => {
      totalImgs++;
      const m = tag.match(/src=["']([^"']+)["']/i);
      if (m) {
        const url = m[1];
        try {
          const u = new URL(url);
          srcDomains[u.hostname] = (srcDomains[u.hostname] || 0) + 1;
          if (u.hostname !== 'media.miregalo.us') {
            nonR2Imgs.push({ slug: p.slug, url });
          }
        } catch {
          srcDomains['invalid'] = (srcDomains['invalid'] || 0) + 1;
          nonR2Imgs.push({ slug: p.slug, url });
        }
      }
    });
  });

  console.log(`Total <img> tags in content_html: ${totalImgs}`);
  console.log('src Hostname breakdown:', srcDomains);
  console.log(`Non-R2 images count: ${nonR2Imgs.length}`);
  if (nonR2Imgs.length > 0) {
    console.log('Sample non-R2 images:');
    nonR2Imgs.slice(0, 10).forEach(x => console.log(`- [${x.slug}] ${x.url}`));
  }
}

run();
