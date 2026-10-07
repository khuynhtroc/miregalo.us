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
  console.log('Fetching all posts from Supabase for comprehensive verification...');
  let allPosts = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('posts')
      .select('id, slug, hero_image, items, content_html')
      .range(from, from + pageSize - 1);

    if (error) { console.error(error); break; }
    if (!data || data.length === 0) break;
    allPosts.push(...data);
    from += pageSize;
    if (data.length < pageSize) break;
  }

  console.log(`Checking ${allPosts.length} posts...`);

  let loveableInHero = 0;
  let loveableInItems = 0;
  let loveableInContentHtml = 0;
  let srcsetInContentHtml = 0;
  let nonR2ImgSrcInContent = 0;

  allPosts.forEach(p => {
    if (p.hero_image && p.hero_image.toLowerCase().includes('loveable') && !p.hero_image.includes('media.miregalo.us/media/ai-heroes/regalos-author-loveable-content-team.jpg')) {
      loveableInHero++;
    }
    if (p.items && JSON.stringify(p.items).toLowerCase().includes('loveable')) {
      loveableInItems++;
    }
    if (p.content_html) {
      if (p.content_html.toLowerCase().includes('loveable.appspot.com') || p.content_html.toLowerCase().includes('loveable.us') || p.content_html.toLowerCase().includes('loveable.ai')) {
        loveableInContentHtml++;
      }
      if (p.content_html.includes('srcset=')) {
        srcsetInContentHtml++;
      }
      const imgs = p.content_html.match(/<img[^>]+src=["']([^"']+)["']/gi) || [];
      imgs.forEach(tag => {
        const m = tag.match(/src=["']([^"']+)["']/i);
        if (m && !m[1].startsWith('https://media.miregalo.us')) {
          nonR2ImgSrcInContent++;
        }
      });
    }
  });

  console.log('\n=== COMPREHENSIVE VERIFICATION REPORT ===');
  console.log(`- Total posts in DB: ${allPosts.length}`);
  console.log(`- Posts with loveable in hero_image: ${loveableInHero}`);
  console.log(`- Posts with loveable in items: ${loveableInItems}`);
  console.log(`- Posts with loveable in content_html: ${loveableInContentHtml}`);
  console.log(`- Posts with srcset in content_html: ${srcsetInContentHtml}`);
  console.log(`- Non-R2 img src in content_html: ${nonR2ImgSrcInContent}`);
  console.log('=========================================\n');
}

run();
