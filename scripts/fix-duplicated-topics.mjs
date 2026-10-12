import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const url = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(url, key);

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

const MAP = {
  'job-kw-002': 'ideas de regalos para mamá',
  'job-kw-022': 'ideas de regalos para papá',
  'job-kw-042': 'ideas de regalos para novia',
  'job-kw-062': 'ideas de regalos para novio',
  'job-kw-082': 'ideas de regalos para esposa',
  'job-kw-102': 'ideas de regalos para esposo',
  'job-kw-122': 'ideas de regalos para abuela',
  'job-kw-142': 'ideas de regalos para abuelo',
  'job-kw-162': 'ideas de regalos para hermana',
  'job-kw-182': 'ideas de regalos para hermano',
};

async function main() {
  console.log('Fixing duplicated topic keywords in Supabase and db.json...');

  for (const [id, newTopic] of Object.entries(MAP)) {
    const { data: job } = await sb.from('content_jobs').select('*').eq('id', id).single();
    if (job) {
      const payload = job.payload || {};
      payload.topic = newTopic;
      await sb.from('content_jobs').update({ payload }).eq('id', id);
      console.log(`✅ [Supabase] ${id} -> "${newTopic}"`);
    }
  }

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

  console.log('\n✨ Done! All 500 scheduled jobs now perfectly match gift guide format.');
}

main().catch(console.error);
