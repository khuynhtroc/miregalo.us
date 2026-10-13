import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const url = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(url, key);

const HALLOWEEN_CAT_ID = 'acbaa7d4-a347-4e39-948d-8670c2d3daf9';

async function main() {
  console.log('=== AUDITING HALLOWEEN SCHEDULE ACROSS SUPABASE & LOCAL DB ===\n');

  // 1. Supabase Posts Audit
  const { data: posts, error: postsErr } = await sb
    .from('posts')
    .select('id, slug, title, status, published_at, items, intro_html, content_html')
    .eq('primary_category_id', HALLOWEEN_CAT_ID)
    .eq('status', 'planned')
    .order('published_at', { ascending: true });

  if (postsErr) {
    console.error('Error fetching planned posts:', postsErr);
    return;
  }

  console.log(`[Supabase] Planned Halloween Posts in 'posts' table: ${posts.length} / 50`);

  // Word count check
  let minWords = Infinity;
  let maxWords = 0;
  let allAbove5k = true;

  posts.forEach((p) => {
    const text = (p.intro_html + ' ' + p.content_html).replace(/<[^>]*>/g, ' ');
    const words = text.split(/\s+/).filter(Boolean).length;
    if (words < minWords) minWords = words;
    if (words > maxWords) maxWords = words;
    if (words < 5000) allAbove5k = false;
  });

  console.log(`Word Counts: Min = ${minWords} words, Max = ${maxWords} words (All >= 5,000 words: ${allAbove5k})`);

  // Distribution by day in Supabase
  const byDay = {};
  posts.forEach((p) => {
    const d = p.published_at.slice(0, 10);
    byDay[d] = (byDay[d] || 0) + 1;
  });
  console.log('Daily Distribution (Target: 10 per day from 13 to 17 Oct):', byDay);

  // 2. Supabase Content Jobs Audit
  const { data: jobs, error: jobsErr } = await sb
    .from('content_jobs')
    .select('id, payload')
    .ilike('id', '%job-hw-%')
    .order('created_at', { ascending: true });

  console.log(`[Supabase] Scheduled Jobs in 'content_jobs' table: ${jobs?.length || 0} / 50`);

  // 3. Products & Image Uniqueness Audit
  const sample = posts[0];
  const imgs = sample.items.map((i) => i.image);
  const uniqueImgs = new Set(imgs);
  console.log(`Product Images in sample post [${sample.slug}]: ${sample.items.length} items, ${uniqueImgs.size} unique images.`);

  // 4. Local DB Sync Check
  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  if (fs.existsSync(dbPath)) {
    const localDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const localPlannedHw = (localDb.posts || []).filter(
      (p) => p.primary_category_id === HALLOWEEN_CAT_ID && p.status === 'planned'
    );
    const localHwJobs = (localDb.content_jobs || []).filter((j) => (j.id || '').includes('job-hw-'));
    console.log(`[Local db.json] Planned Halloween Posts: ${localPlannedHw.length}`);
    console.log(`[Local db.json] Halloween content_jobs: ${localHwJobs.length}`);
  }

  console.log('\n🎉 AUDIT COMPLETED SUCCESSFULLY!');
}

main().catch(console.error);
