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
  const { data: posts, error } = await supabase.from('posts').select('id, slug, hero_image, items, content_html');
  if (error) { console.error(error); return; }

  console.log('=== 1. Posts with loveable in hero_image ===');
  const heroPosts = posts.filter(p => p.hero_image && p.hero_image.includes('loveable'));
  heroPosts.forEach(p => console.log(`- [${p.id}] ${p.slug}: ${p.hero_image}`));

  console.log('\n=== 2. Items with loveable image URLs ===');
  let itemImagesCount = 0;
  let itemAffLinksCount = 0;
  posts.forEach(p => {
    if (Array.isArray(p.items)) {
      p.items.forEach((it, idx) => {
        if (it.image && it.image.includes('loveable')) {
          itemImagesCount++;
          if (itemImagesCount <= 10) {
            console.log(`- [${p.slug}] item[${idx}].image: ${it.image}`);
          }
        }
        if (it.affiliate_url && it.affiliate_url.includes('loveable')) {
          itemAffLinksCount++;
        }
      });
    }
  });
  console.log(`Total item images with loveable: ${itemImagesCount}`);
  console.log(`Total item affiliate_url with loveable: ${itemAffLinksCount}`);

  console.log('\n=== 3. Content HTML loveable image inspection ===');
  let contentImgSrcLoveable = 0;
  let contentImgSrcsetLoveable = 0;
  let sampleContentImages = [];

  posts.forEach(p => {
    if (!p.content_html) return;
    const imgTags = p.content_html.match(/<img[^>]+>/gi) || [];
    imgTags.forEach(tag => {
      const srcMatch = tag.match(/src=["']([^"']+)["']/i);
      const srcsetMatch = tag.match(/srcset=["']([^"']+)["']/i);
      
      const hasSrcLoveable = srcMatch && srcMatch[1].includes('loveable');
      const hasSrcsetLoveable = srcsetMatch && srcsetMatch[1].includes('loveable');

      if (hasSrcLoveable) contentImgSrcLoveable++;
      if (hasSrcsetLoveable) contentImgSrcsetLoveable++;

      if ((hasSrcLoveable || hasSrcsetLoveable) && sampleContentImages.length < 5) {
        sampleContentImages.push({ slug: p.slug, tag });
      }
    });
  });

  console.log(`Images in content with loveable in src: ${contentImgSrcLoveable}`);
  console.log(`Images in content with loveable in srcset: ${contentImgSrcsetLoveable}`);
  console.log('\nSamples:');
  sampleContentImages.forEach(s => {
    console.log(`Post: ${s.slug}`);
    console.log(`Tag: ${s.tag.substring(0, 300)}...`);
  });
}

run();
