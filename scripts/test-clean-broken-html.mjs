import fs from 'fs';

const d = JSON.parse(fs.readFileSync('scripts/broken-images-report.json', 'utf8'));
const post = d.brokenHeroPosts.find(p => p.post.id === 'post-regalos-aniversario-deseos-para-amigos');
let html = post.post.content_html;

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function removeBrokenImage(htmlContent, brokenUrl) {
  const escaped = escapeRegex(brokenUrl);
  // Match figure containing the img
  const figureRegex = new RegExp('<figure[^>]*>\\s*<img[^>]*src=[\"\']' + escaped + '[\"\'][^>]*>\\s*(?:<figcaption[^>]*>[\\s\\S]*?<\\/figcaption>\\s*)?<\\/figure>', 'gi');
  let cleaned = htmlContent.replace(figureRegex, '');
  // Match standalone img
  const imgRegex = new RegExp('<img[^>]*src=[\"\']' + escaped + '[\"\'][^>]*>', 'gi');
  cleaned = cleaned.replace(imgRegex, '');
  return cleaned;
}

const testUrl = 'https://blog-admin.loveable.ai/wp-content/uploads/2023/09/Short-and-Cute-Anniversary-Messages-for-Friends.jpg';
const beforeLen = html.length;
const after = removeBrokenImage(html, testUrl);
console.log('Before len:', beforeLen, 'After len:', after.length, 'Replaced:', beforeLen !== after.length);
console.log('Snippet around heading:');
const idx = after.indexOf('Mensajes de aniversario cortos y lindos para amigos');
console.log(after.substring(idx - 10, idx + 250));
