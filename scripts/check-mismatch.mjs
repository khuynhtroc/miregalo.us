import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

async function main() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const env = Object.fromEntries(
    envContent
      .split('\n')
      .filter((l) => l.includes('='))
      .map((l) => {
        const parts = l.trim().split('=');
        return [parts[0], parts.slice(1).join('=')];
      })
  );
  const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  const sb = createClient(url, key);

  const { data: posts } = await sb.from('posts').select('id, slug, title, items').limit(25);
  let totalItems = 0;
  let matchingProducts = 0;
  let missingPosts = [];

  for (const p of posts) {
    if (!p.items || !p.items.length) continue;
    let postMatches = 0;
    for (let i = 0; i < p.items.length; i++) {
      totalItems++;
      const item = p.items[i];
      const targetSlug = `${p.slug}-item-${i + 1}`;
      const { data: prod } = await sb.from('products').select('id').eq('slug', targetSlug).maybeSingle();
      if (prod) {
        matchingProducts++;
        postMatches++;
      }
    }
    if (postMatches === 0) {
      missingPosts.push(p.slug);
    }
  }
  console.log(`Checked sample posts: totalItems = ${totalItems}, matching in products table = ${matchingProducts}`);
  console.log('Posts completely missing from products table:', missingPosts);
}

main().catch(console.error);
