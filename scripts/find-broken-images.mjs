import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
const envFile = fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf-8') : '';
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUrl(url) {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return { ok: false, status: 0, error: 'invalid_url' };
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    // Try HEAD first
    let res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timer);
    if (res.status === 405 || res.status === 403) {
      // Some CDNs reject HEAD or require GET
      const getCtrl = new AbortController();
      const getTimer = setTimeout(() => getCtrl.abort(), 6000);
      res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-10' }, signal: getCtrl.signal });
      clearTimeout(getTimer);
    }
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, status: 0, error: err.message };
  }
}

async function run() {
  console.log('Fetching all published posts from Supabase...');
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, slug, title, type, hero_image, items, content_html')
    .eq('status', 'published');

  if (error) {
    console.error('Supabase error:', error);
    process.exit(1);
  }

  console.log(`Found ${posts.length} published posts. Scanning hero images...`);

  const brokenHeroPosts = [];
  const brokenItemImages = [];
  const brokenContentImages = [];

  // 1. Check hero images
  let checkedHero = 0;
  for (const post of posts) {
    checkedHero++;
    if (!post.hero_image) {
      brokenHeroPosts.push({ post, reason: 'missing_hero_image', url: post.hero_image });
      continue;
    }
    const check = await checkUrl(post.hero_image);
    if (!check.ok) {
      brokenHeroPosts.push({ post, reason: `http_${check.status || check.error}`, url: post.hero_image });
      console.log(`[Broken Hero] Post: "${post.title}" (${post.slug}) -> ${post.hero_image} (${check.status || check.error})`);
    }
    if (checkedHero % 50 === 0) {
      console.log(`Checked ${checkedHero}/${posts.length} hero images... (${brokenHeroPosts.length} broken found)`);
    }
  }

  console.log(`\n=== RESULT FOR HERO IMAGES ===`);
  console.log(`Total posts: ${posts.length}`);
  console.log(`Broken hero images: ${brokenHeroPosts.length}`);

  // Save report
  fs.writeFileSync(
    'scripts/broken-images-report.json',
    JSON.stringify({ brokenHeroPosts, count: brokenHeroPosts.length }, null, 2)
  );

  console.log('Report saved to scripts/broken-images-report.json');
}

run().catch(console.error);
