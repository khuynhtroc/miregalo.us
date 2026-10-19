import fs from 'fs';
import path from 'path';

const GSC_DIR = 'C:\\Users\\OK\\Downloads\\https___www.miregalo.us_-Performance-on-Search-2026-10-19';

function parseCsv(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
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
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] !== undefined ? cols[idx] : '';
    });
    rows.push(row);
  }
  return rows;
}

const queriesRaw = parseCsv(path.join(GSC_DIR, 'Queries.csv'));
const auditPages = JSON.parse(fs.readFileSync('scripts/top-pages-audit.json', 'utf8')).filter(p => !p.not_found_in_db);

const queries = queriesRaw.map(q => ({
  query: q['Top queries'] || q['Query'],
  clicks: parseInt(q['Clicks'] || '0', 10),
  impressions: parseInt(q['Impressions'] || '0', 10),
  ctr: q['CTR'],
  position: parseFloat(q['Position'] || '0'),
})).filter(q => q.query);

// Stop words in Spanish
const STOP_WORDS = new Set(['de', 'la', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para', 'con', 'no', 'una', 'su', 'al', 'lo', 'como', 'más', 'pero', 'sus', 'le', 'ya', 'o', 'este', 'sí', 'porque', 'esta', 'son', 'entre', 'está', 'cuando', 'muy', 'sin', 'sobre', 'ser', 'tiene', 'también', 'me', 'hasta', 'hay', 'donde', 'quien', 'desde', 'todo', 'nos', 'durante', 'todos', 'uno', 'les', 'ni', 'contra', 'otros', 'ese', 'eso', 'ante', 'ellos', 'e', 'esto', 'mí', 'antes', 'algunos', 'qué', 'unos', 'yo', 'otro', 'otras', 'otra', 'él', 'tanto', 'esa', 'estos', 'mucho', 'quienes', 'nada', 'muchos', 'cual', 'sea', 'poco', 'ella', 'estar', 'haber', 'estas', 'estaba', 'estamos', 'algunas', 'algo', 'nosotros']);

function getTokens(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOP_WORDS.has(t));
}

// Map queries to pages
const pageQueryMap = new Map();
for (const p of auditPages) {
  pageQueryMap.set(p.db_slug, {
    page: p,
    matchedQueries: [],
  });
}

for (const q of queries) {
  const qTokens = getTokens(q.query);
  if (qTokens.length === 0) continue;

  let bestSlug = null;
  let bestScore = 0;

  for (const p of auditPages) {
    const slugTokens = getTokens(p.db_slug.replace(/^regalos-/, ''));
    const titleTokens = getTokens(p.title);
    const combinedTokens = new Set([...slugTokens, ...titleTokens]);

    let matchCount = 0;
    for (const qt of qTokens) {
      if (combinedTokens.has(qt)) matchCount++;
    }

    const score = matchCount / qTokens.length;
    if (score > bestScore && score >= 0.5) {
      bestScore = score;
      bestSlug = p.db_slug;
    }
  }

  if (bestSlug && bestScore >= 0.5) {
    pageQueryMap.get(bestSlug).matchedQueries.push({
      ...q,
      score: bestScore,
    });
  }
}

// Convert map to array and sort matchedQueries by impressions
const mappedResults = Array.from(pageQueryMap.values())
  .map(item => {
    item.matchedQueries.sort((a, b) => b.impressions - a.impressions);
    item.total_impressions_from_queries = item.matchedQueries.reduce((sum, q) => sum + q.impressions, 0);
    return item;
  })
  .sort((a, b) => b.page.clicks - a.page.clicks || b.total_impressions_from_queries - a.total_impressions_from_queries);

fs.writeFileSync('scripts/mapped-page-queries.json', JSON.stringify(mappedResults, null, 2));

console.log('=== TOP PAGES & MATCHED OPPORTUNITY QUERIES ===');
for (const item of mappedResults.slice(0, 15)) {
  console.log(`\nPage: ${item.page.title} (Clicks: ${item.page.clicks}, Imp: ${item.page.impressions})`);
  console.log(`URL: ${item.page.url}`);
  console.log(`Matched Queries (${item.matchedQueries.length}):`);
  for (const mq of item.matchedQueries.slice(0, 5)) {
    console.log(`   - "${mq.query}" -> ${mq.impressions} imp, ${mq.clicks} clicks, pos: ${mq.position}`);
  }
}
