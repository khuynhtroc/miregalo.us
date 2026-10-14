import { createClient } from '@supabase/supabase-js';

const url = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(url, key);

async function main() {
  const { data: job } = await sb.from('content_jobs').select('*').eq('id', 'job-kw-038').single();
  if (job) {
    const payload = job.payload || {};
    payload.status = 'scheduled';
    const { error } = await sb.from('content_jobs').update({
      stage: 'research',
      payload,
      updated_at: new Date().toISOString(),
    }).eq('id', 'job-kw-038');
    console.log('Reset job-kw-038 result:', error ? error.message : 'SUCCESS');
  }
}

main().catch(console.error);
