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
  const { data: posts } = await supabase.from('posts').select('id, slug, items');

  const itemImgDomains = {};
  let totalItems = 0;
  const nonR2Items = [];

  posts.forEach(p => {
    if (!Array.isArray(p.items)) return;
    p.items.forEach((it, idx) => {
      totalItems++;
      if (!it.image) {
        itemImgDomains['empty'] = (itemImgDomains['empty'] || 0) + 1;
        return;
      }
      try {
        const u = new URL(it.image);
        itemImgDomains[u.hostname] = (itemImgDomains[u.hostname] || 0) + 1;
        if (u.hostname !== 'media.miregalo.us') {
          nonR2Items.push({ slug: p.slug, idx, url: it.image });
        }
      } catch {
        itemImgDomains['invalid'] = (itemImgDomains['invalid'] || 0) + 1;
        nonR2Items.push({ slug: p.slug, idx, url: it.image });
      }
    });
  });

  console.log(`Total items checked: ${totalItems}`);
  console.log('Item Image Hostname breakdown:', itemImgDomains);
  console.log(`Non-R2 item images count: ${nonR2Items.length}`);
  if (nonR2Items.length > 0) {
    console.log('Sample non-R2 item images:');
    nonR2Items.slice(0, 10).forEach(x => console.log(`- [${x.slug}] item[${x.idx}]: ${x.url}`));
  }
}

run();
