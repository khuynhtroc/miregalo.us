async function check(url) {
  console.log(`Checking ${url}...`);
  const r = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
  console.log('Status:', r.status);
  const text = await r.text();
  
  // Find "Guías recomendadas"
  const idx = text.indexOf('Guías recomendadas');
  if (idx !== -1) {
    const chunk = text.substring(idx, idx + 4000);
    console.log('--- Guías recomendadas snippet ---');
    // Extract title, date, img
    const cards = [...chunk.matchAll(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)];
    for (const card of cards) {
      const href = card[1];
      const body = card[2];
      const titleMatch = body.match(/font-weight: 600[^>]*>([^<]+)</) || body.match(/class="[^"]*title[^"]*">([^<]+)</);
      const title = titleMatch ? titleMatch[1].trim() : 'Unknown';
      const imgMatch = body.match(/<img[^>]*src="([^"]*)"/);
      const img = imgMatch ? imgMatch[1] : (body.includes('🎁') ? 'FALLBACK EMOJI 🎁' : 'NONE');
      const dateMatch = body.match(/Actualizado:[^<]*<time[^>]*>([^<]+)<\/time>/) || body.match(/<time[^>]*>([^<]+)<\/time>/);
      const date = dateMatch ? dateMatch[0].replace(/<[^>]*>/g, '').trim() : 'NO DATE';
      console.log(`- [${title}] (${href})`);
      console.log(`  Img: ${img}`);
      console.log(`  Date: ${date}`);
    }
  } else {
    console.log('Section "Guías recomendadas" not found');
  }
}

async function main() {
  await check('https://www.miregalo.us/ideas-de-regalos-para-mama/');
}

main().catch(console.error);
