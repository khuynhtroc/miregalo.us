import fs from 'fs';
const data = JSON.parse(fs.readFileSync('./scripts/broken-images-report.json', 'utf8'));
console.log('Total broken posts:', data.brokenHeroPosts.length);
data.brokenHeroPosts.forEach((b, i) => {
  console.log(`${i + 1}. [${b.reason}] ID: ${b.post.id} | Slug: ${b.post.slug} | Title: "${b.post.title}" | Type: ${b.post.type} | URL: ${b.url || 'NONE'}`);
});
