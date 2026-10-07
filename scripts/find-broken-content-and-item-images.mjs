import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

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
    let res = await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(timer);
    if (res.status === 405 || res.status === 403) {
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
  console.log('Fetching posts...');
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, slug, title, items, content_html')
    .eq('status', 'published');

  if (error) {
    console.error(error);
    process.exit(1);
  }

  const brokenItemImages = [];
  const brokenContentImages = [];
  const checkedUrls = new Map();

  async function checkCached(url) {
    if (checkedUrls.has(url)) return checkedUrls.get(url);
    const res = await checkUrl(url);
    checkedUrls.set(url, res);
    return res;
  }

  console.log(`Checking items & content for ${posts.length} posts...`);
  for (let i = 0; i < posts.length; i++) {
    const p = posts[i];

    // Check items
    if (p.items && Array.isArray(p.items)) {
      for (let idx = 0; idx < p.items.length; idx++) {
        const it = p.items[idx];
        if (it.image) {
          const check = await checkCached(it.image);
          if (!check.ok) {
            brokenItemImages.push({
              postId: p.id,
              postSlug: p.slug,
              itemIndex: idx,
              heading: it.heading,
              url: it.image,
              status: check.status || check.error,
            });
          }
        }
      }
    }

    // Check content_html
    if (p.content_html && p.content_html.includes('<img')) {
      const imgMatches = Array.from(p.content_html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi));
      for (const m of imgMatches) {
        const src = m[1];
        const check = await checkCached(src);
        if (!check.ok) {
          brokenContentImages.push({
            postId: p.id,
            postSlug: p.slug,
            postTitle: p.title,
            url: src,
            status: check.status || check.error,
          });
        }
      }
    }

    if ((i + 1) % 100 === 0) {
      console.log(`Checked ${i + 1}/${posts.length} posts... Found ${brokenItemImages.length} broken items, ${brokenContentImages.length} broken content imgs`);
    }
  }

  console.log('\n=== SCAN SUMMARY ===');
  console.log(`Unique URLs checked: ${checkedUrls.size}`);
  console.log(`Broken Item Images: ${brokenItemImages.length}`);
  console.log(`Broken Content Images: ${brokenContentImages.length}`);

  fs.writeFileSync(
    'scripts/broken-content-and-items.json',
    JSON.stringify({ brokenItemImages, brokenContentImages }, null, 2)
  );
}

run().catch(console.error);
