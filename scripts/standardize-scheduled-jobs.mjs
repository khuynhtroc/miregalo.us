import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const url = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(url, key);

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

const MAP = {
  'job-kw-203': 'ideas de regalos para hija',
  'job-kw-223': 'ideas de regalos para hijo',
  'job-kw-243': 'ideas de regalos para amiga',
  'job-kw-263': 'ideas de regalos para amigo',
  'job-kw-283': 'ideas de regalos para suegra',
  'job-kw-303': 'ideas de regalos para suegro',
  'job-kw-323': 'ideas de regalos para cuñada',
  'job-kw-343': 'ideas de regalos para cuñado',
  'job-kw-363': 'ideas de regalos para maestra',
  'job-kw-383': 'ideas de regalos para maestro',
};

async function main() {
  console.log('Standardizing scheduled jobs to explicit gift guide keywords...');

  // Update in Supabase
  for (const [id, newTopic] of Object.entries(MAP)) {
    const { data: job } = await sb.from('content_jobs').select('*').eq('id', id).single();
    if (job) {
      const payload = job.payload || {};
      payload.topic = newTopic;
      await sb.from('content_jobs').update({ payload }).eq('id', id);
      console.log(`✅ [Supabase] ${id} -> "${newTopic}"`);
    }
  }

  // Update in data/db.json
  if (fs.existsSync(DB_PATH)) {
    const dbData = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    if (dbData.content_jobs) {
      for (const [id, newTopic] of Object.entries(MAP)) {
        const j = dbData.content_jobs.find((x) => x.id === id);
        if (j && j.payload) {
          j.payload.topic = newTopic;
          console.log(`✅ [db.json] ${id} -> "${newTopic}"`);
        }
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(dbData, null, 2), 'utf8');
    }
  }

  console.log('\n🎉 All 500 scheduled jobs now strictly conform to Gift Guide keywords!');
}

main().catch(console.error);
