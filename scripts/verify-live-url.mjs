async function check() {
  const res = await fetch('https://www.miregalo.us/blog/regalos-halloween-party-names/');
  const html = await res.text();
  console.log('HTTP Status:', res.status);
  console.log('Contains loveable.appspot.com:', html.includes('loveable.appspot.com'));
  const match = html.match(/class="article-hero"[^>]*src="([^"]+)"/);
  console.log('Hero src:', match ? match[1] : 'not found');
  const allImgs = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map(m => m[1]);
  console.log('All image sources on page:');
  allImgs.forEach(img => console.log('  -', img));
}

check().catch(console.error);
