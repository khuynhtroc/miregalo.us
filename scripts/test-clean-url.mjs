import fs from 'fs';

function cleanUrl(url) {
  if (!url || typeof url !== 'string') return url;
  return url
    .replace(/^https?:\/\/storage\.googleapis\.com\/loveable\.appspot\.com\//gi, 'https://media.miregalo.us/media/')
    .replace(/^https?:\/\/loveable\.appspot\.com\//gi, 'https://media.miregalo.us/media/')
    .replace(/^https?:\/\/cdn\.loveable\.us\//gi, 'https://media.miregalo.us/media/');
}

function cleanHtml(html) {
  if (!html || typeof html !== 'string') return html;
  return html
    .replace(/\s+srcset=["'][^"']*["']/gi, '')
    .replace(/\s+sizes=["'][^"']*["']/gi, '')
    .replace(/\s+tamaños=["'][^"']*["']/gi, '')
    .replace(/https?:\/\/storage\.googleapis\.com\/loveable\.appspot\.com\//gi, 'https://media.miregalo.us/media/')
    .replace(/https?:\/\/loveable\.appspot\.com\//gi, 'https://media.miregalo.us/media/')
    .replace(/https?:\/\/cdn\.loveable\.us\//gi, 'https://media.miregalo.us/media/')
    .replace(/https?:\/\/blog\.loveable\.us\/blog\/([a-zA-Z0-9_-]+)\/?/gi, '/blog/regalos-$1/')
    .replace(/https?:\/\/blog\.loveable\.us\/([a-zA-Z0-9_-]+)\/?/gi, '/blog/regalos-$1/')
    .replace(/https?:\/\/blog-admin\.loveable\.ai[^\s"'<>]+/gi, '#')
    .replace(/https?:\/\/loveable\.us\/[^\s"'<>]+/gi, '#')
    .replace(/https?:\/\/loveable\.ai\/[^\s"'<>]+/gi, '#');
}

const db = JSON.parse(fs.readFileSync('data/db.json', 'utf8'));
const post = db.posts.find(p => p.slug === 'regalos-halloween-party-names');

console.log('BEFORE:');
console.log('hero_image:', post.hero_image);
console.log('AFTER:');
console.log('hero_image:', cleanUrl(post.hero_image));
