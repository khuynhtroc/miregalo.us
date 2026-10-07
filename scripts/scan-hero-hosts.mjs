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
  const { data: posts } = await supabase.from('posts').select('id, slug, hero_image');

  const heroDomains = {};
  const nonR2Heroes = [];

  posts.forEach(p => {
    if (!p.hero_image) {
      heroDomains['empty'] = (heroDomains['empty'] || 0) + 1;
      nonR2Heroes.push({ slug: p.slug, url: 'EMPTY' });
      return;
    }
    try {
      const u = new URL(p.hero_image);
      heroDomains[u.hostname] = (heroDomains[u.hostname] || 0) + 1;
      if (u.hostname !== 'media.miregalo.us') {
        nonR2Heroes.push({ slug: p.slug, url: p.hero_image });
      }
    } catch {
      heroDomains['invalid'] = (heroDomains['invalid'] || 0) + 1;
      nonR2Heroes.push({ slug: p.slug, url: p.hero_image });
    }
  });

  console.log('Hero Image Hostname breakdown:', heroDomains);
  console.log(`Non-R2 hero images count: ${nonR2Heroes.length}`);
  if (nonR2Heroes.length > 0) {
    nonR2Heroes.forEach(x => console.log(`- [${x.slug}] ${x.url}`));
  }
}

run();
