import { createClient } from '@supabase/supabase-js';

const url = 'https://cewrrewgnziioyujlseg.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNld3JyZXdnbnppaW95dWpsc2VnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NTAwNzY4MCwiZXhwIjoyMTEwNTgzNjgwfQ.DglEXEs0KVe5HZLciCKzBS0lWc6rUA0iVRaUmMI7c_0';
const sb = createClient(url, key);

async function main() {
  const { data: jobs } = await sb.from('content_jobs').select('*').in('id', ['job-hw-001', 'job-kw-038', 'job-hw-002']);
  for (const j of jobs || []) {
    console.log(`=== ${j.id} ===`);
    console.log('stage:', j.stage);
    console.log('error:', j.error);
    console.log('payload:', j.payload);
    console.log('result:', j.result);
  }
}

main().catch(console.error);
