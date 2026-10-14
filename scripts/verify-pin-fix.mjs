async function verifyLive() {
  const url = 'https://www.miregalo.us/ideas-de-regalos-para-mama/';
  console.log(`Checking ${url}...`);
  const res = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
  const html = await res.text();
  console.log('HTTP Status:', res.status);

  // Check product media blocks
  const matches = [...html.matchAll(/<div class="product-horizontal-media"[^>]*>([\s\S]*?)<\/div>/g)];
  console.log(`Total product horizontal media blocks found: ${matches.length}`);

  if (matches.length > 0) {
    console.log('\n--- First Product Media Block HTML: ---');
    console.log(matches[0][0]);
    
    const hasPinBtn = matches[0][0].includes('product-pin-btn');
    const hasMediaLink = matches[0][0].includes('product-media-link');
    const hasProductImg = matches[0][0].includes('product-img');
    console.log(`\nVerification checks:`);
    console.log(`- Has product-pin-btn class: ${hasPinBtn}`);
    console.log(`- Has product-media-link class: ${hasMediaLink}`);
    console.log(`- Has product-img: ${hasProductImg}`);
  }
}

verifyLive().catch(console.error);
