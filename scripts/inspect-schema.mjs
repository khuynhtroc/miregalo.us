import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('=== INSPECTING SCHEMA & COLUMNS ===');

  // 1. redirects
  const { data: sampleRed } = await sb.from('redirects').select('*').limit(1);
  console.log('redirects sample row keys:', sampleRed ? Object.keys(sampleRed[0] || {}) : 'none');
  if (sampleRed && sampleRed[0]) console.log('Sample redirect:', sampleRed[0]);

  // 2. content_jobs
  const { data: sampleJobs, count: jobsCount } = await sb.from('content_jobs').select('*', { count: 'exact' }).limit(5);
  console.log('\ncontent_jobs count:', jobsCount);
  if (sampleJobs && sampleJobs.length) {
    console.log('Sample jobs:', sampleJobs.map(j => ({ id: j.id, stage: j.stage, payload: j.payload })));
  }

  // 3. check how many total posts are in posts table (using count: 'exact')
  const { count: postCount } = await sb.from('posts').select('*', { count: 'exact', head: true });
  console.log('\nTotal posts in DB:', postCount);
  
  const { count: publishedCount } = await sb.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'published');
  console.log('Published posts:', publishedCount);

  const { count: plannedCount } = await sb.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'planned');
  console.log('Planned posts:', plannedCount);

  const { count: draftCount } = await sb.from('posts').select('*', { count: 'exact', head: true }).eq('status', 'draft');
  console.log('Draft posts:', draftCount);
}

main().catch(console.error);
