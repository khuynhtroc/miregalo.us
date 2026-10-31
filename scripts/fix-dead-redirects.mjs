import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const FIXES = [
  { source: '/valentines-day-gifts-for-him/', destination: '/regalos/para-novio/' },
  { source: '/valentines-day-gifts-for-her/', destination: '/regalos/para-novia/' },
  { source: '/fathers-day-gifts/', destination: '/regalos/para-papa/' },
  { source: '/wedding-gift-ideas/', destination: '/bodas/' },
  { source: '/graduation-gifts/', destination: '/graduacion/' },
  { source: '/gifts-for-nature-lovers/', destination: '/regalos/' },
  { source: '/sample-christmas-gifts/', destination: '/regalos/navidad/' },
];

async function main() {
  console.log('=== FIXING 7 DEAD INTERNAL REDIRECTS ===\n');

  for (const item of FIXES) {
    const { data: existing, error: findErr } = await sb
      .from('redirects')
      .select('id, source, destination, code')
      .eq('source', item.source);

    if (findErr) {
      console.error(`Lỗi tìm ${item.source}:`, findErr.message);
      continue;
    }

    if (existing && existing.length > 0) {
      for (const row of existing) {
        console.log(`Cập nhật rule [${row.id}]: ${row.source} -> ${item.destination} (cũ: ${row.destination})`);
        const { error: updErr } = await sb
          .from('redirects')
          .update({
            destination: item.destination,
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id);

        if (updErr) {
          console.error(`  ❌ Lỗi update:`, updErr.message);
        } else {
          console.log(`  ✅ Thành công!`);
        }
      }
    } else {
      console.log(`Không tìm thấy rule ${item.source}, thêm mới rule...`);
      const { error: insErr } = await sb.from('redirects').insert({
        source: item.source,
        destination: item.destination,
        code: 301,
        active: true,
      });
      if (insErr) console.error(`  ❌ Lỗi insert:`, insErr.message);
      else console.log(`  ✅ Đã thêm mới!`);
    }
  }

  // Also update settings.gsc_verification if empty
  const { data: settingRow } = await sb.from('settings').select('*').eq('key', 'site').single();
  if (settingRow) {
    const val = settingRow.value || {};
    if (!val.gsc_verification) {
      val.gsc_verification = 'googlecefa57c8e7df7167';
      console.log('\nCập nhật settings.gsc_verification thành: googlecefa57c8e7df7167');
      const { error: sUpdErr } = await sb.from('settings').update({ value: val }).eq('key', 'site');
      if (sUpdErr) console.error('Lỗi update settings:', sUpdErr.message);
      else console.log('✅ Đã cập nhật gsc_verification thành công!');
    }
  }

  console.log('\n=== HOÀN TẤT CẬP NHẬT ===');
}

main().catch(console.error);
