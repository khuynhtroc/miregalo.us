import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const url = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(url, key);

export function updateYearsInText(str) {
  if (!str || typeof str !== 'string') return str;
  return str.replace(/\b202[45]\b/g, '2026');
}

export function updateYearsInHtml(html) {
  if (!html || typeof html !== 'string') return html;

  // 1. Replace inside text nodes between > and <
  let res = html.replace(/>([^<]+)</g, (match, text) => {
    return '>' + text.replace(/\b202[45]\b/g, '2026') + '<';
  });

  // 2. Replace inside heading IDs (id="...")
  res = res.replace(/id="([^"]*?)\b202[45]\b([^"]*?)"/g, (match, before, after) => {
    return `id="${before}2026${after}"`;
  });

  // 3. Replace inside alt attributes (alt="...")
  res = res.replace(/alt="([^"]*?)\b202[45]\b([^"]*?)"/g, (match, before, after) => {
    return `alt="${before}2026${after}"`;
  });

  return res;
}

export function updateYearsInItems(items) {
  if (!items || !Array.isArray(items)) return items;
  return items.map((item) => {
    const updated = { ...item };
    if (updated.heading) updated.heading = updateYearsInText(updated.heading);
    if (updated.description_html) updated.description_html = updateYearsInHtml(updated.description_html);
    if (updated.ideal_for) updated.ideal_for = updateYearsInText(updated.ideal_for);
    if (Array.isArray(updated.pros)) {
      updated.pros = updated.pros.map((p) => updateYearsInText(p));
    }
    if (Array.isArray(updated.cons)) {
      updated.cons = updated.cons.map((c) => updateYearsInText(c));
    }
    return updated;
  });
}

export function updateYearsInFaqs(faqs) {
  if (!faqs || !Array.isArray(faqs)) return faqs;
  return faqs.map((faq) => ({
    ...faq,
    q: updateYearsInText(faq.q),
    a: updateYearsInText(faq.a),
  }));
}

function processPost(post) {
  const updates = {};
  const changedFields = [];

  const newTitle = updateYearsInText(post.title);
  if (newTitle !== post.title) {
    updates.title = newTitle;
    changedFields.push('title');
  }

  const newSeoTitle = updateYearsInText(post.seo_title);
  if (newSeoTitle !== post.seo_title) {
    updates.seo_title = newSeoTitle;
    changedFields.push('seo_title');
  }

  const newSeoDesc = updateYearsInText(post.seo_description);
  if (newSeoDesc !== post.seo_description) {
    updates.seo_description = newSeoDesc;
    changedFields.push('seo_description');
  }

  const newExcerpt = updateYearsInText(post.excerpt);
  if (newExcerpt !== post.excerpt) {
    updates.excerpt = newExcerpt;
    changedFields.push('excerpt');
  }

  const newContentHtml = updateYearsInHtml(post.content_html);
  if (newContentHtml !== post.content_html) {
    updates.content_html = newContentHtml;
    changedFields.push('content_html');
  }

  const newItems = updateYearsInItems(post.items);
  if (JSON.stringify(newItems) !== JSON.stringify(post.items)) {
    updates.items = newItems;
    changedFields.push('items');
  }

  const newFaqs = updateYearsInFaqs(post.faqs);
  if (JSON.stringify(newFaqs) !== JSON.stringify(post.faqs)) {
    updates.faqs = newFaqs;
    changedFields.push('faqs');
  }

  return { hasChanges: changedFields.length > 0, updates, changedFields };
}

async function runMigration() {
  console.log('=== STARTING 2024/2025 -> 2026 MIGRATION ===\n');

  console.log('1. Fetching all posts from Supabase...');
  const { data: posts, error } = await sb
    .from('posts')
    .select('id, slug, title, seo_title, seo_description, excerpt, content_html, items, faqs');

  if (error || !posts) {
    console.error('Error fetching posts:', error);
    return;
  }

  console.log(`Found ${posts.length} posts in Supabase.\n`);

  let updatedCount = 0;
  const changeLog = [];

  for (const p of posts) {
    const { hasChanges, updates, changedFields } = processPost(p);
    if (!hasChanges) continue;

    console.log(`Updating post [${p.id}] (${p.slug}) -> changed fields: [${changedFields.join(', ')}]`);
    if (updates.title) {
      console.log(`  Old title: "${p.title}"`);
      console.log(`  New title: "${updates.title}"`);
    }

    const { error: uErr } = await sb
      .from('posts')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', p.id);

    if (uErr) {
      console.error(`  ERROR updating post ${p.id}:`, uErr);
    } else {
      updatedCount++;
      changeLog.push({ id: p.id, slug: p.slug, fields: changedFields });
    }
  }

  console.log(`\n✅ Supabase migration complete: ${updatedCount} posts updated to year 2026!`);

  // 2. Update local data/db.json if present
  if (fs.existsSync('data/db.json')) {
    console.log('\n2. Updating local data/db.json...');
    const localDb = JSON.parse(fs.readFileSync('data/db.json', 'utf8'));
    let localUpdated = 0;
    if (Array.isArray(localDb.posts)) {
      localDb.posts = localDb.posts.map((p) => {
        const { hasChanges, updates } = processPost(p);
        if (hasChanges) {
          localUpdated++;
          return { ...p, ...updates };
        }
        return p;
      });
      fs.writeFileSync('data/db.json', JSON.stringify(localDb, null, 2), 'utf8');
      console.log(`✅ data/db.json updated: ${localUpdated} posts updated.`);
    }
  }

  // 3. Update local data/seed.json if present
  if (fs.existsSync('data/seed.json')) {
    console.log('\n3. Updating local data/seed.json...');
    const seedDb = JSON.parse(fs.readFileSync('data/seed.json', 'utf8'));
    let seedUpdated = 0;
    if (Array.isArray(seedDb.posts)) {
      seedDb.posts = seedDb.posts.map((p) => {
        const { hasChanges, updates } = processPost(p);
        if (hasChanges) {
          seedUpdated++;
          return { ...p, ...updates };
        }
        return p;
      });
      fs.writeFileSync('data/seed.json', JSON.stringify(seedDb, null, 2), 'utf8');
      console.log(`✅ data/seed.json updated: ${seedUpdated} posts updated.`);
    }
  }

  console.log('\n=== MIGRATION FINISHED SUCCESSFULLY ===');
}

runMigration().catch(console.error);
