import { createClient } from '@supabase/supabase-js';

const url = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(url, key);

async function main() {
  const { data: jobs, error } = await sb.from('content_jobs').select('id, stage, error, created_at, updated_at, payload, result');
  if (error || !jobs) {
    console.error('Error fetching jobs:', error);
    return;
  }

  console.log(`Total jobs in DB: ${jobs.length}`);

  const statusMap = {};
  const processing = [];
  const errors = [];
  const published = [];
  const scheduled = [];

  const now = new Date();

  for (const j of jobs) {
    const s = j.payload?.status || 'unknown';
    statusMap[s] = (statusMap[s] || 0) + 1;

    if (s === 'processing') processing.push(j);
    if (s === 'failed' || j.stage === 'error') errors.push(j);
    if (s === 'published' || j.stage === 'done') published.push(j);
    if (s === 'scheduled') scheduled.push(j);
  }

  console.log('Status counts:', statusMap);

  console.log('\n--- Processing Jobs (Zombie?) ---');
  for (const j of processing) {
    console.log(`- ${j.id}: stage=${j.stage}, updated_at=${j.updated_at}, topic="${j.payload?.topic}"`);
  }

  console.log('\n--- Failed/Error Jobs ---');
  for (const j of errors) {
    console.log(`- ${j.id}: stage=${j.stage}, error="${j.error}", topic="${j.payload?.topic}"`);
  }

  console.log('\n--- Published Jobs ---');
  for (const j of published) {
    console.log(`- ${j.id}: stage=${j.stage}, slug="${j.result?.slug}", published_at="${j.result?.published_at}"`);
  }

  scheduled.sort((a, b) => new Date(a.payload?.scheduled_for || 0).getTime() - new Date(b.payload?.scheduled_for || 0).getTime());

  const overdue = scheduled.filter(j => new Date(j.payload?.scheduled_for || 0) <= now);
  console.log(`\n--- Overdue Scheduled Jobs (${overdue.length} jobs) ---`);
  for (const j of overdue.slice(0, 10)) {
    console.log(`- ${j.id}: scheduled_for="${j.payload?.scheduled_for}", topic="${j.payload?.topic}"`);
  }
}

main().catch(console.error);
