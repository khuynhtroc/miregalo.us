import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const db = JSON.parse(fs.readFileSync('data/db.json', 'utf8'));
  const localPlanned = (db.posts || []).filter(p => p.status === 'planned');
  console.log('Tổng số bài planned trong file local data/db.json:', localPlanned.length);

  const slugs = localPlanned.map(p => p.slug);
  const { data: supaPosts, error } = await sb.from('posts').select('id, slug, status, title').in('slug', slugs);

  if (error) {
    console.error('Lỗi truy vấn Supabase:', error);
    return;
  }

  console.log('Tìm thấy trong Supabase (Production):', supaPosts?.length || 0);
  const supaMap = new Map((supaPosts || []).map(p => [p.slug, p]));

  let publishedInSupa = 0;
  let plannedInSupa = 0;
  const missingInSupa = [];

  for (const p of localPlanned) {
    const sp = supaMap.get(p.slug);
    if (!sp) {
      missingInSupa.push(p.slug);
    } else if (sp.status === 'published') {
      publishedInSupa++;
    } else {
      plannedInSupa++;
      console.log('Vẫn còn planned trên Supabase:', p.slug);
    }
  }

  console.log({
    'Đã published trên Supabase': publishedInSupa,
    'Còn planned trên Supabase': plannedInSupa,
    'Chưa có trên Supabase': missingInSupa.length
  });

  if (missingInSupa.length > 0) {
    console.log('Các slug chưa có trên Supabase:', missingInSupa);
  }
}
check().catch(console.error);
