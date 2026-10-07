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
  const { data: posts } = await supabase.from('posts').select('id, slug, hero_image, items, content_html');

  console.log('--- 1. Hero images with loveable ---');
  posts.filter(p => p.hero_image && p.hero_image.toLowerCase().includes('loveable')).forEach(p => {
    console.log(p.slug, p.hero_image);
  });

  console.log('\n--- 2. Content HTML with loveable ---');
  posts.filter(p => p.content_html && (p.content_html.includes('loveable.appspot.com') || p.content_html.includes('loveable.us') || p.content_html.includes('loveable.ai'))).forEach(p => {
    const matches = p.content_html.match(/https?:\/\/[^\s"'<>\\]*loveable[^\s"'<>\\]*/gi) || [];
    console.log(p.slug, matches);
  });

  console.log('\n--- 3. Items with loveable ---');
  let itemMatches = [];
  posts.forEach(p => {
    if (!Array.isArray(p.items)) return;
    const str = JSON.stringify(p.items);
    if (str.toLowerCase().includes('loveable')) {
      const m = str.match(/https?:\/\/[^\s"'<>\\]*loveable[^\s"'<>\\]*/gi) || [];
      if (m.length > 0) itemMatches.push({ slug: p.slug, matches: m });
      // check text fields
      p.items.forEach((it, idx) => {
        if (it.merchant && it.merchant.toLowerCase().includes('loveable')) {
          console.log(`[${p.slug}] item[${idx}].merchant:`, it.merchant);
        }
      });
    }
  });
  console.log('Posts with loveable URLs in items:', itemMatches.length);
  if (itemMatches.length > 0) {
    console.log('Sample item matches:', itemMatches.slice(0, 5));
  }

  console.log('\n--- 4. Non-R2 img src in content ---');
  const nonR2Hosts = {};
  const nonR2List = [];
  posts.forEach(p => {
    if (!p.content_html) return;
    const imgs = p.content_html.match(/<img[^>]+src=["']([^"']+)["']/gi) || [];
    imgs.forEach(tag => {
      const m = tag.match(/src=["']([^"']+)["']/i);
      if (m && !m[1].startsWith('https://media.miregalo.us')) {
        try {
          const u = new URL(m[1]);
          nonR2Hosts[u.hostname] = (nonR2Hosts[u.hostname] || 0) + 1;
          nonR2List.push({ slug: p.slug, src: m[1] });
        } catch {
          nonR2Hosts['invalid'] = (nonR2Hosts['invalid'] || 0) + 1;
          nonR2List.push({ slug: p.slug, src: m[1] });
        }
      }
    });
  });
  console.log('Non-R2 hosts in content:', nonR2Hosts);
  console.log('Sample non-R2 img src:');
  nonR2List.slice(0, 10).forEach(x => console.log(`- [${x.slug}] ${x.src}`));
}

run();
