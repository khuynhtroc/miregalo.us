import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { DEFAULT_ANALYTICS } from '../lib/analytics/data.ts';

const url = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(url, key);

async function sync() {
  const analyticsRecord = {
    ...DEFAULT_ANALYTICS,
    id: 'analytics-main',
    updated_at: new Date().toISOString(),
  };

  // 1. Update Supabase
  console.log('Upserting analytics to Supabase...');
  const { data, error } = await sb.from('analytics').upsert(analyticsRecord);
  if (error) {
    console.error('Error updating analytics in Supabase:', error);
  } else {
    console.log('✓ Successfully synced real GA4 analytics to Supabase!');
  }

  // 2. Update local db.json
  const dbPath = 'data/db.json';
  if (fs.existsSync(dbPath)) {
    const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    db.analytics = [analyticsRecord];
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
    console.log('✓ Successfully synced real GA4 analytics to local db.json!');
  }
}

sync().catch(console.error);
