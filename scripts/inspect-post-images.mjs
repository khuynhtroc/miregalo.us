import { createClient } from '@supabase/supabase-js';

const url = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(url, key);

async function main() {
  const { data: posts, error } = await sb
    .from('posts')
    .select('id, slug, title, hero_image, items')
    .ilike('slug', '%ideas-de-regalos-para-mama%');

  if (error) {
    console.error('Error fetching post:', error);
    return;
  }

  console.log('Posts matching ideas-de-regalos-para-mama:', posts?.length);
  if (posts && posts.length > 0) {
    const p = posts[0];
    console.log('Post ID:', p.id);
    console.log('Title:', p.title);
    console.log('Post hero image:', p.hero_image);
    console.log('Post items length:', p.items?.length);
    p.items?.forEach((item, idx) => {
      console.log(`Item #${idx + 1}: [${item.heading}] -> image: "${item.image}"`);
    });
  }

  // Also check scheduled/content_jobs and all posts
  console.log('\n=== Checking all posts in posts table for duplicated item images ===');
  const { data: allPosts, error: allErr } = await sb
    .from('posts')
    .select('id, slug, title, status, items')
    .not('items', 'is', null);

  console.log(`Total posts in database: ${allPosts?.length}`);
  let postsWithDupItems = [];
  for (const post of allPosts || []) {
    if (!post.items || !Array.isArray(post.items) || post.items.length <= 1) continue;
    const images = post.items.map(it => it.image).filter(Boolean);
    const unique = new Set(images);
    if (unique.size < images.length) {
      postsWithDupItems.push({
        id: post.id,
        slug: post.slug,
        title: post.title,
        status: post.status,
        itemCount: post.items.length,
        uniqueImages: unique.size,
        sampleDup: images[0]
      });
    }
  }

  console.log(`Posts with duplicate item images: ${postsWithDupItems.length}`);
  postsWithDupItems.slice(0, 10).forEach(p => {
    console.log(`- [${p.slug}] (${p.status}) Items: ${p.itemCount}, Unique Imgs: ${p.uniqueImages}`);
  });

  console.log('\n=== Checking content_jobs (scheduled queue) ===');
  const { data: jobs, error: jErr } = await sb
    .from('content_jobs')
    .select('id, status, scheduled_for, payload')
    .limit(100);

  console.log(`Jobs checked: ${jobs?.length}`);
  let jobsWithItems = 0;
  for (const j of jobs || []) {
    if (j.payload?.items && j.payload.items.length > 0) {
      jobsWithItems++;
      const imgs = j.payload.items.map(it => it.image).filter(Boolean);
      const unique = new Set(imgs);
      if (unique.size < imgs.length) {
        console.log(`Job [${j.id}] scheduled_for: ${j.scheduled_for} has ${imgs.length} items with ${unique.size} unique images!`);
      }
    }
  }
  console.log(`Jobs with pre-generated items: ${jobsWithItems}`);
}

main().catch(console.error);
