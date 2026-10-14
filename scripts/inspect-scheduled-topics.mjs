import { createClient } from '@supabase/supabase-js';

const url = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(url, key);

async function main() {
  const { data: jobs, error } = await sb.from('content_jobs').select('*').order('created_at', { ascending: true });
  if (error) {
    console.error(error);
    return;
  }
  console.log(`Total jobs in content_jobs: ${jobs.length}`);

  let nonGiftCount = 0;
  const nonGiftJobs = [];

  for (const j of jobs) {
    const payload = j.payload || {};
    const topic = payload.topic || '';
    const isGiftGuide = /regalo|obsequio|detalle|gift/i.test(topic);
    if (!isGiftGuide) {
      nonGiftCount++;
      nonGiftJobs.push({ id: j.id, topic, payload });
    }
  }

  console.log(`Jobs containing gift keywords (regalo/obsequio/detalle): ${jobs.length - nonGiftCount}`);
  console.log(`Jobs NOT containing explicit gift keywords: ${nonGiftCount}`);

  if (nonGiftJobs.length > 0) {
    console.log('\nSample non-gift jobs:');
    nonGiftJobs.slice(0, 20).forEach(j => {
      console.log(`- [${j.id}] Topic: "${j.topic}" | Silo: ${j.payload.silo} | Cluster: ${j.payload.cluster}`);
    });
  } else {
    console.log('\nALL 500 jobs have gift keywords!');
  }
}

main().catch(console.error);
