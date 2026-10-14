import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

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

async function inspect() {
  console.log('=== CHECKING SUPABASE POSTS TABLE ===');
  
  // Total posts
  const { count: totalPosts, error: countErr } = await sb
    .from('posts')
    .select('*', { count: 'exact', head: true });
  console.log(`Total posts in Supabase: ${totalPosts}`);

  // Fetch all posts in chunks of 500
  let from = 0;
  const pageSize = 500;
  let allPosts = [];
  while (true) {
    const { data, error } = await sb
      .from('posts')
      .select('id, slug, hero_image, intro_html, content_html, items')
      .range(from, from + pageSize - 1);
    if (error) {
      console.error('Error fetching:', error);
      break;
    }
    if (!data || data.length === 0) break;
    allPosts.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  console.log(`Fetched ${allPosts.length} posts from Supabase.`);

  let heroCount = 0;
  let introCount = 0;
  let contentCount = 0;
  let itemsCount = 0;
  let totalWithLoveable = 0;

  const affectedPosts = [];

  for (const p of allPosts) {
    let hasLoveable = false;
    let details = {};

    if (p.hero_image && p.hero_image.includes('loveable')) {
      heroCount++;
      hasLoveable = true;
      details.hero = p.hero_image;
    }
    if (p.intro_html && p.intro_html.includes('loveable')) {
      introCount++;
      hasLoveable = true;
      details.intro = true;
    }
    if (p.content_html && p.content_html.includes('loveable')) {
      contentCount++;
      hasLoveable = true;
      details.content = true;
    }
    if (p.items && JSON.stringify(p.items).includes('loveable')) {
      itemsCount++;
      hasLoveable = true;
      details.items = true;
    }

    if (hasLoveable) {
      totalWithLoveable++;
      affectedPosts.push({ id: p.id, slug: p.slug, details });
    }
  }

  console.log(`\nResults for Supabase Posts:`);
  console.log(`- Total posts with 'loveable': ${totalWithLoveable}`);
  console.log(`- In hero_image: ${heroCount}`);
  console.log(`- In intro_html: ${introCount}`);
  console.log(`- In content_html: ${contentCount}`);
  console.log(`- In items: ${itemsCount}`);

  console.log('\nSample 5 affected posts:');
  console.log(JSON.stringify(affectedPosts.slice(0, 5), null, 2));

  // Also check content_jobs
  const { data: jobs } = await sb.from('content_jobs').select('id, payload').limit(500);
  let jobsWithLoveable = 0;
  for (const j of jobs || []) {
    if (JSON.stringify(j.payload || {}).includes('loveable')) {
      jobsWithLoveable++;
    }
  }
  console.log(`\nJobs with loveable in payload: ${jobsWithLoveable} / ${jobs?.length || 0}`);
}

inspect().catch(console.error);
