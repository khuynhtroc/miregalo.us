import { createClient } from '@supabase/supabase-js';

const url = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(url, key);

async function main() {
  const { data: jobs, error } = await sb.from('content_jobs').select('id, payload');
  if (error || !jobs) {
    console.error('Error fetching jobs:', error);
    return;
  }

  const scheduled = jobs.filter((j) => j.id !== 'job-kw-001' && j.payload?.status === 'scheduled');
  scheduled.sort((a, b) => new Date(a.payload?.scheduled_for).getTime() - new Date(b.payload?.scheduled_for).getTime());

  console.log(`Total scheduled jobs in Supabase: ${scheduled.length}`);
  console.log('\nTop 12 earliest scheduled jobs starting tomorrow:');
  scheduled.slice(0, 12).forEach((j, i) => {
    console.log(`${i + 1}. [${j.id}] ⏰ ${j.payload?.scheduled_for} | ${j.payload?.cluster} | "${j.payload?.topic}"`);
  });
}

main().catch(console.error);
