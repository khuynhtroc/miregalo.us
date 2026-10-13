import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const url = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(url, key);

const AHREFS_KEY = 'TxPIlr+hGAIJpqeul2OREw';

async function main() {
  console.log('--- UPDATING AHREFS WEB ANALYTICS SETTINGS ---');

  // 1. Update Supabase settings
  const { data: currentSetting } = await sb.from('settings').select('value').eq('key', 'site').maybeSingle();
  const currentValue = currentSetting?.value || {};
  const updatedValue = {
    ...currentValue,
    ahrefs_key: AHREFS_KEY
  };

  const { error: sbErr } = await sb
    .from('settings')
    .upsert({
      key: 'site',
      value: updatedValue,
      updated_at: new Date().toISOString()
    });

  if (sbErr) {
    console.error('Error updating Supabase settings:', sbErr);
  } else {
    console.log('✅ Supabase settings table updated with ahrefs_key:', AHREFS_KEY);
  }

  // 2. Update local data/db.json
  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  if (fs.existsSync(dbPath)) {
    const localDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    if (!localDb.settings) localDb.settings = {};
    if (!localDb.settings.site) localDb.settings.site = {};
    localDb.settings.site.ahrefs_key = AHREFS_KEY;
    fs.writeFileSync(dbPath, JSON.stringify(localDb, null, 2), 'utf8');
    console.log('✅ Local data/db.json updated with ahrefs_key:', AHREFS_KEY);
  }
}

main().catch(console.error);
