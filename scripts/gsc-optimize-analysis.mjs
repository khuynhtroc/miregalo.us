import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const GSC_DIR = 'C:\\Users\\OK\\Downloads\\https___www.miregalo.us_-Performance-on-Search-2026-10-19';

const SUPABASE_URL = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

function parseCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    // Regex to handle CSV with quotes
    const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
    const row = {};
    const cols = [];
    let insideQuotes = false;
    let current = '';
    for (const char of lines[i]) {
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        cols.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    cols.push(current.trim().replace(/^"|"$/g, ''));

    headers.forEach((h, idx) => {
      row[h] = cols[idx] !== undefined ? cols[idx] : '';
    });
    rows.push(row);
  }
  return rows;
}

async function main() {
  console.log('=== GSC PERFORMANCE & CONTENT OPTIMIZATION ANALYSIS ===');
  
  const pagesRaw = parseCsv(path.join(GSC_DIR, 'Pages.csv'));
  const queriesRaw = parseCsv(path.join(GSC_DIR, 'Queries.csv'));
  const countriesRaw = parseCsv(path.join(GSC_DIR, 'Countries.csv'));

  console.log(`Loaded ${pagesRaw.length} pages, ${queriesRaw.length} queries, ${countriesRaw.length} countries.`);

  // 1. Pages with clicks
  const pagesWithClicks = pagesRaw
    .map(p => ({
      url: p['Top pages'] || p['Page'] || p[Object.keys(p)[0]],
      clicks: parseInt(p['Clicks'] || '0', 10),
      impressions: parseInt(p['Impressions'] || '0', 10),
      ctr: p['CTR'],
      position: parseFloat(p['Position'] || '0'),
    }))
    .filter(p => p.clicks > 0)
    .sort((a, b) => b.clicks - a.clicks);

  console.log(`Found ${pagesWithClicks.length} pages with clicks > 0.`);

  // 2. High impression queries (>= 5 impressions)
  const queries = queriesRaw
    .map(q => ({
      query: q['Top queries'] || q['Query'] || q[Object.keys(q)[0]],
      clicks: parseInt(q['Clicks'] || '0', 10),
      impressions: parseInt(q['Impressions'] || '0', 10),
      ctr: q['CTR'],
      position: parseFloat(q['Position'] || '0'),
    }))
    .sort((a, b) => b.impressions - a.impressions);

  console.log(`Found ${queries.length} queries, top impression: "${queries[0]?.query}" (${queries[0]?.impressions} imp)`);

  // Write quick summary json
  fs.writeFileSync(
    'scripts/gsc-summary.json',
    JSON.stringify({ pagesWithClicks, topQueries: queries.slice(0, 100) }, null, 2)
  );

  console.log('Saved gsc-summary.json. Now fetching top pages content from Supabase...');
}

main().catch(console.error);
