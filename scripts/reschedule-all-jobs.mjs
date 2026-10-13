import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const url = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(url, key);

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

async function main() {
  console.log('--- RESCHEDULING 500 JOBS TO START FROM TOMORROW (13 OCT 2026) ---');

  // 1. Fetch all content_jobs from Supabase
  const { data: allJobs, error } = await sb
    .from('content_jobs')
    .select('id, payload')
    .order('created_at', { ascending: true });

  if (error || !allJobs) {
    console.error('Failed to fetch jobs:', error);
    process.exit(1);
  }

  // Filter out job-kw-001 (already published) and Halloween jobs (scheduled separately)
  const scheduledJobs = allJobs.filter(
    (j) => j.id !== 'job-kw-001' && !j.id.startsWith('job-hw-') && j.payload?.status === 'scheduled'
  );

  console.log(`Found ${scheduledJobs.length} scheduled jobs to re-sequence.`);

  // Sort by order_index or numeric ID ascending
  scheduledJobs.sort((a, b) => {
    const idxA = a.payload?.order_index ?? parseInt(a.id.replace(/\D/g, ''), 10);
    const idxB = b.payload?.order_index ?? parseInt(b.id.replace(/\D/g, ''), 10);
    return idxA - idxB;
  });

  const slots = [6, 12, 18]; // 6:00, 12:00, 18:00 (GMT+7)
  const updates = [];

  for (let k = 0; k < scheduledJobs.length; k++) {
    const job = scheduledJobs[k];
    const dayOffset = Math.floor(k / 3);
    const slot = k % 3;
    const hour = slots[slot];

    // Start date: 13 October 2026 (tomorrow)
    const targetDate = new Date(2026, 9, 13 + dayOffset);
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    const hh = String(hour).padStart(2, '0');

    const scheduled_for = `${yyyy}-${mm}-${dd}T${hh}:00:00+07:00`;

    const payload = {
      ...(job.payload || {}),
      scheduled_for,
      order_index: k + 2, // 2 to 500
    };

    updates.push({
      id: job.id,
      payload,
      topic: payload.topic,
      scheduled_for,
    });
  }

  console.log('\nPreviewing first 6 rescheduled jobs:');
  updates.slice(0, 6).forEach((u, i) => {
    console.log(`[#${i + 1}] ${u.id} | ${u.scheduled_for} | "${u.topic}"`);
  });

  console.log('\nPreviewing last 3 rescheduled jobs:');
  updates.slice(-3).forEach((u, i) => {
    console.log(`[#${updates.length - 2 + i}] ${u.id} | ${u.scheduled_for} | "${u.topic}"`);
  });

  // 2. Perform updates in Supabase in batches of 25
  console.log('\nApplying updates to Supabase in batches of 25...');
  const BATCH_SIZE = 25;
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map((item) =>
        sb
          .from('content_jobs')
          .update({
            payload: item.payload,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id)
      )
    );
    process.stdout.write(`Updated ${Math.min(i + BATCH_SIZE, updates.length)} / ${updates.length} jobs...\r`);
  }
  console.log(`\n✅ Supabase updated: ${updates.length} jobs rescheduled successfully!`);

  // 3. Update local data/db.json if it exists
  if (fs.existsSync(DB_PATH)) {
    console.log('\nUpdating data/db.json...');
    const dbData = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    if (Array.isArray(dbData.content_jobs)) {
      const updateMap = new Map(updates.map((u) => [u.id, u.payload]));
      let localUpdatedCount = 0;
      for (const localJob of dbData.content_jobs) {
        if (updateMap.has(localJob.id)) {
          localJob.payload = updateMap.get(localJob.id);
          localJob.updated_at = new Date().toISOString();
          localUpdatedCount++;
        }
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(dbData, null, 2), 'utf8');
      console.log(`✅ data/db.json updated: ${localUpdatedCount} jobs updated!`);
    }
  }

  console.log('\n🎉 ALL DONE! The scheduled queue now starts tomorrow: 13 Oct 2026 06:00!');
}

main().catch(console.error);
