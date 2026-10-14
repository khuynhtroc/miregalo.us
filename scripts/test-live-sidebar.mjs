async function verify() {
  const testUrls = [
    'https://www.miregalo.us/regalos-women/',
    'https://www.miregalo.us/para-hombres/',
    'https://www.miregalo.us/ideas-de-regalos-para-mama/'
  ];

  for (const url of testUrls) {
    console.log(`\n========================================`);
    console.log(`Testing: ${url}`);
    const res = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
    console.log(`HTTP Status: ${res.status}`);
    const html = await res.text();

    // Check sidebar "Guías recomendadas"
    const asideMatch = html.match(/<aside[\s\S]*?<\/aside>/);
    if (asideMatch) {
      console.log('Found <aside> sidebar!');
      const asideHtml = asideMatch[0];
      const items = [...asideHtml.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)];
      console.log(`Found ${items.length} sidebar items:`);
      items.forEach((item, idx) => {
        const text = item[1];
        const titleMatch = text.match(/<span[^>]*style="[^"]*font-weight:\s*600[^"]*"[^>]*>([\s\S]*?)<\/span>/);
        const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : 'No title';
        const imgMatch = text.match(/<img[^>]*src="([^"]*)"/);
        const hasEmoji = text.includes('🎁');
        const img = imgMatch ? imgMatch[1] : (hasEmoji ? '🎁 EMOJI' : 'NO IMG');
        const dateMatch = text.match(/<time[^>]*>([\s\S]*?)<\/time>/);
        const date = dateMatch ? dateMatch[1].trim() : 'NO DATE';
        const prefixMatch = text.match(/<span>(Actualizado:?)<\/span>/);
        const prefix = prefixMatch ? prefixMatch[1] : '';
        console.log(`  [${idx + 1}] Title: "${title}"`);
        console.log(`      Image: ${img}`);
        console.log(`      Date:  ${prefix} ${date}`);
      });
    } else {
      console.log('No <aside> sidebar on this page.');
    }
  }
}

verify().catch(console.error);
