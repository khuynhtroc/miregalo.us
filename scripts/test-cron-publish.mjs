import { createClient } from '@supabase/supabase-js';

const url = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(url, key);

async function simulateFastPath() {
  console.log('Testing fast-path logic for job-hw-001...');
  
  // 1. Fetch job-hw-001
  const { data: job } = await sb.from('content_jobs').select('*').eq('id', 'job-hw-001').single();
  console.log('Current job-hw-001:', { stage: job.stage, status: job.payload?.status, post_id: job.result?.post_id });

  // 2. Fetch associated post
  const { data: post } = await sb.from('posts').select('id, slug, title, status').eq('id', job.result?.post_id).single();
  console.log('Current post:', post);

  if (post && post.status !== 'published') {
    const nowIso = new Date().toISOString();
    // Activate post
    const { error: postErr } = await sb.from('posts').update({
      status: 'published',
      published_at: nowIso,
      updated_at: nowIso,
    }).eq('id', post.id);

    // Update job
    const { error: jobErr } = await sb.from('content_jobs').update({
      stage: 'done',
      updated_at: nowIso,
      payload: { ...job.payload, status: 'published' },
      result: {
        ...job.result,
        published_at: nowIso,
      },
    }).eq('id', job.id);

    console.log('Fast path activation result:', { postErr: postErr?.message || null, jobErr: jobErr?.message || null });
  }

  // 3. Verify public retrieval
  const { data: publishedPost } = await sb.from('posts').select('id, slug, title, status, published_at').eq('id', job.result?.post_id).single();
  console.log('Published post verification:', publishedPost);
}

simulateFastPath().catch(console.error);
