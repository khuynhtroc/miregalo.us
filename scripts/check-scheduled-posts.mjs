import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('=== KIỂM TRA TRẠNG THÁI TẤT CẢ BÀI VIẾT TRONG DATABASE ===\n');

  // Fetch all posts with minimal fields
  let allPosts = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const { data, error } = await sb.from('posts').select('id, slug, title, status, published_at').range(from, from + step - 1);
    if (error) {
      console.error('Fetch error:', error);
      break;
    }
    if (!data || data.length === 0) break;
    allPosts.push(...data);
    if (data.length < step) break;
    from += step;
  }

  const statusCounts = {};
  const futurePosts = [];
  const now = new Date();

  allPosts.forEach(p => {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    if (p.published_at && new Date(p.published_at) > now) {
      futurePosts.push(p);
    }
  });

  console.log('Tổng số bài viết:', allPosts.length);
  console.log('Phân bố trạng thái (status):', statusCounts);
  console.log('Số bài có published_at > hiện tại (lên lịch tương lai):', futurePosts.length);

  if (futurePosts.length > 0) {
    console.log('\nDanh sách bài lên lịch tương lai:');
    futurePosts.slice(0, 10).forEach(p => {
      console.log(`- [${p.status}] /${p.slug}/ (published_at: ${p.published_at}) - ${p.title}`);
    });
  }

  // Also check if there are any jobs in jobs or background tasks table
  const { data: tables, error: tErr } = await sb.from('jobs').select('*').limit(10);
  if (!tErr) {
    console.log('\nBảng jobs:', tables?.length || 0, 'jobs');
    if (tables?.length) console.log(tables);
  }
}

main().catch(console.error);
