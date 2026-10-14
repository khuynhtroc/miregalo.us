import fs from 'fs';

const db = JSON.parse(fs.readFileSync('data/db.json', 'utf8'));
const post = db.posts.find(p => p.slug === 'regalos-halloween-party-names');

if (post) {
  console.log('Post:', post.slug);
  console.log('hero_image:', post.hero_image);
  console.log('og_image:', post.og_image);
  console.log('items count:', post.items?.length);
  post.items?.slice(0, 3).forEach(it => console.log('  item image:', it.image));
  
  const content = post.content_html || '';
  const matches = [...content.matchAll(/src=["']([^"']+)["']/g)].map(m => m[1]);
  console.log('Images in content_html:', matches.length);
  matches.forEach(m => console.log('  content img:', m));
} else {
  console.log('Post not found');
}
