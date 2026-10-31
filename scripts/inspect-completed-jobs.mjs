import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectCompletedJobs() {
  const { data: jobs } = await sb
    .from('content_jobs')
    .select('id, stage, payload, result, updated_at')
    .or('stage.eq.done,stage.eq.published')
    .order('updated_at', { ascending: false })
    .limit(5);

  console.log('5 completed content_jobs gần đây nhất:');
  jobs?.forEach(j => {
    console.log(`- Job ID: ${j.id}`);
    console.log(`  Topic: ${j.payload?.topic}`);
    console.log(`  Status in payload: ${j.payload?.status}`);
    console.log(`  Stage: ${j.stage}`);
    console.log(`  Updated at: ${j.updated_at}`);
    console.log(`  Result:`, j.result);
    console.log('');
  });
}

inspectCompletedJobs().catch(console.error);
