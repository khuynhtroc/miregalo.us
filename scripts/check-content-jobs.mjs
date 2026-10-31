import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkJobs() {
  console.log('=== KIỂM TRA BẢNG CONTENT_JOBS (HÀNG ĐỢI LÊN LỊCH TỰ ĐỘNG) ===\n');
  const { data: jobs, error } = await sb.from('content_jobs').select('*');
  if (error) {
    console.error('Lỗi truy vấn content_jobs:', error.message);
    return;
  }
  console.log('Tổng số content_jobs trong database:', jobs.length);
  const statusCounts = {};
  jobs.forEach(j => {
    const s = j.payload?.status || j.status || 'unknown';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });
  console.log('Phân bố trạng thái content_jobs:', statusCounts);

  const pending = jobs.filter(j => (j.payload?.status || j.status) === 'scheduled');
  console.log('Số job còn pending/scheduled:', pending.length);
  if (pending.length > 0) {
    console.log('\nDanh sách các job pending:');
    pending.forEach((j, idx) => {
      console.log(`${idx + 1}. [ID: ${j.id}] Keyword: ${j.payload?.keyword || j.title} | Scheduled For: ${j.payload?.scheduled_for || 'N/A'}`);
    });
  }

  // Also check local db.json content_jobs if any
  if (fs.existsSync('data/db.json')) {
    const db = JSON.parse(fs.readFileSync('data/db.json', 'utf8'));
    const localJobs = db.content_jobs || [];
    console.log('\nTrong file local data/db.json có:', localJobs.length, 'content_jobs');
  }
}

checkJobs().catch(console.error);
