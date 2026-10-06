import fs from 'fs';

const source = JSON.parse(fs.readFileSync('data/source-articles-list.json', 'utf8'));
const giftArticles = source.filter(s => !s.originalUrl.includes('/blog/'));

console.log('Gift articles count in source list:', giftArticles.length);

// Check keyword url map or master keywords if exists
let map = {};
if (fs.existsSync('data/keyword-url-map.json')) {
  map = JSON.parse(fs.readFileSync('data/keyword-url-map.json', 'utf8'));
}

let matched = 0;
let unmatched = 0;
const unmatchedList = [];

for (const g of giftArticles) {
  if (map[g.originalSlug]) {
    matched++;
  } else {
    unmatched++;
    unmatchedList.push(g.originalSlug);
  }
}

console.log(`Matched with keyword map: ${matched}, Unmatched: ${unmatched}`);
if (unmatchedList.length > 0) {
  console.log('Sample unmatched:', unmatchedList.slice(0, 10));
}
