async function main() {
  const url = 'https://www.miregalo.us/ideas-de-regalos-para-mama/?t=' + Date.now();
  console.log('Fetching:', url);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    }
  });

  console.log('Status:', res.status);
  const text = await res.text();

  // Match all <img ... class="product-img" ...>
  const regex = /<img[^>]+src="([^"]+)"[^>]+alt="([^"]+)"[^>]+class="product-img"/g;
  let m;
  const items = [];
  while ((m = regex.exec(text)) !== null) {
    items.push({ alt: m[2], src: m[1] });
  }

  // Also check if src comes after class
  if (items.length === 0) {
    const altRegex = /<img[^>]+class="product-img"[^>]+src="([^"]+)"[^>]+alt="([^"]+)"/g;
    while ((m = altRegex.exec(text)) !== null) {
      items.push({ alt: m[2], src: m[1] });
    }
  }

  console.log(`Found ${items.length} product images in live page:`);
  items.forEach((it, idx) => {
    console.log(`#${idx + 1}: [${it.alt}] -> ${it.src}`);
  });

  const unique = new Set(items.map(it => it.src));
  console.log(`\nResult: ${unique.size} unique images out of ${items.length} items.`);
}

main().catch(console.error);
