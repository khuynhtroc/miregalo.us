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
  if (!url || typeof url !== 'string' || !url.startsWith('http')) return { ok: false, status: 0 };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timer);
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, status: 0, error: err.message };
  }
}

async function run() {
  console.log('Fetching all published posts from Supabase...');
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, slug, title, hero_image, items')
    .eq('status', 'published');

  if (error) {
    console.error(error);
    process.exit(1);
  }

  console.log(`Checking hero_images across ${posts.length} posts...`);

  let missingHeroCount = 0;
  let brokenHeroCount = 0;
  const sampleChecked = [];

  for (const post of posts) {
    if (!post.hero_image || post.hero_image.trim() === '') {
      missingHeroCount++;
      console.log(`[Missing Hero] ${post.id} (${post.slug})`);
    } else if (post.hero_image.includes('ai-heroes')) {
      sampleChecked.push(post);
    }
  }

  console.log(`\nResults for Hero Images:`);
  console.log(`Total Posts: ${posts.length}`);
  console.log(`Missing Hero Images: ${missingHeroCount}`);
  console.log(`AI-Heroes posts found: ${sampleChecked.length}`);

  console.log('\nChecking live HTTP status of AI Hero images:');
  for (const p of sampleChecked) {
    const res = await checkUrl(p.hero_image);
    console.log(`- ${p.slug}: ${p.hero_image} -> HTTP ${res.status} (${res.ok ? 'OK' : 'FAIL'})`);
  }

  console.log('\nChecking Item #48 of post-regalos-divertidos-60th-cumpleanos:');
  const targetPost = posts.find(p => p.id === 'post-regalos-divertidos-60th-cumpleanos');
  if (targetPost && targetPost.items && targetPost.items[48]) {
    const item = targetPost.items[48];
    const res = await checkUrl(item.image);
    console.log(`Item #48: ${item.heading} -> ${item.image} -> HTTP ${res.status} (${res.ok ? 'OK' : 'FAIL'})`);
  }
}

run();
