import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDetailedJobs() {
  console.log('=== PHÂN TÍCH HÀNG ĐỢI CONTENT_JOBS TRÊN SUPABASE ===\n');
  const { data: jobs, error } = await sb.from('content_jobs').select('id, stage, payload, created_at, updated_at');
  if (error) {
    console.error('Lỗi:', error.message);
    return;
  }

  const now = new Date();
  console.log(`Thời gian hiện tại: ${now.toISOString()}`);
  console.log(`Tổng số jobs trong bảng content_jobs: ${jobs.length}\n`);

  const statusMap = {};
  const overdueJobs = [];
  const futureJobs = [];
  const completedJobs = [];

  jobs.forEach(j => {
    const p = j.payload || {};
    const status = p.status || j.stage || 'unknown';
    statusMap[status] = (statusMap[status] || 0) + 1;

    if (status === 'scheduled') {
      const scheduledTime = p.scheduled_for ? new Date(p.scheduled_for) : null;
      if (!scheduledTime || scheduledTime <= now) {
        overdueJobs.push({ id: j.id, scheduled_for: p.scheduled_for, keyword: p.keyword || p.title, stage: j.stage });
      } else {
        futureJobs.push({ id: j.id, scheduled_for: p.scheduled_for, keyword: p.keyword || p.title });
      }
    } else if (status === 'completed' || status === 'published') {
      completedJobs.push(j);
    }
  });

  console.log('Phân bố trạng thái jobs:', statusMap);
  console.log(`- Số jobs đã hoàn thành: ${completedJobs.length}`);
  console.log(`- Số jobs lên lịch trong TƯƠNG LAI (chưa tới hạn): ${futureJobs.length}`);
  console.log(`- Số jobs ĐÃ ĐẾN HẠN / QUÁ HẠN (scheduled_for <= now): ${overdueJobs.length}`);

  if (overdueJobs.length > 0) {
    console.log('\nTop 10 jobs đã đến hạn cần xử lý ngay:');
    overdueJobs.slice(0, 10).forEach(j => {
      console.log(`  * [${j.id}] Keyword: "${j.keyword}" | Hạn: ${j.scheduled_for} | Stage: ${j.stage}`);
    });
  }

  if (futureJobs.length > 0) {
    futureJobs.sort((a, b) => new Date(a.scheduled_for) - new Date(b.scheduled_for));
    console.log('\nJob tương lai gần nhất sắp đến hạn:');
    console.log(`  * [${futureJobs[0].id}] Keyword: "${futureJobs[0].keyword}" | Hạn: ${futureJobs[0].scheduled_for}`);
  }
}

checkDetailedJobs().catch(console.error);
