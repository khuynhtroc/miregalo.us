const slugs = [
  'regalos-women',
  'regalos-boda',
  'regalos-san-valentin',
  'regalos-uncategorized',
  'regalos-jubilacion',
  'regalos-recipients',
  'regalos-relationship',
  'regalos-frases'
];

async function main() {
  console.log('Checking all 8 guide pages on https://www.miregalo.us/:\n');
  for (const s of slugs) {
    const res = await fetch(`https://www.miregalo.us/${s}/`, { cache: 'no-store' });
    const html = await res.text();
    const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1]?.replace(/<[^>]*>/g, '').trim();
    const prods = (html.match(/product-row|product-card|card-product/g) || []).length;
    console.log(`- /${s}/`);
    console.log(`  Status: ${res.status} | H1: "${h1}"`);
    console.log(`  Products rendered: ${prods}`);
    console.log(`  Has Table of Contents: ${html.includes('Índice de contenidos')}\n`);
  }
}

main().catch(console.error);
