async function main() {
  const res = await fetch('https://www.miregalo.us/', { cache: 'no-store' });
  const html = await res.text();
  console.log('--- LIVE HOME PAGE ---');
  console.log('Status:', res.status);
  console.log('Includes Miregalo in Title:', html.includes('Miregalo'));
  console.log('Includes miregalo-logo.png:', html.includes('miregalo-logo.png'));
  console.log('Includes favicon.png:', html.includes('favicon.png'));
  console.log('Includes google-site-verification:', html.includes('q3ZACanWRjwIhlEdAb7fksnumlaM9OHH829aq6STcnc'));
  console.log('Includes GA4 G-WRGWXTNWV3:', html.includes('G-WRGWXTNWV3'));
  console.log('Includes GTM GTM-NLLPRRXN:', html.includes('GTM-NLLPRRXN'));

  const faqsRes = await fetch('https://www.miregalo.us/faqs/', { cache: 'no-store' });
  const faqsHtml = await faqsRes.text();
  console.log('\n--- LIVE FAQS PAGE ---');
  console.log('Status:', faqsRes.status);
  console.log('Includes Preguntas Frecuentes:', faqsHtml.includes('Preguntas Frecuentes'));
  console.log('Includes Miregalo in breadcrumb:', faqsHtml.includes('Miregalo'));

  const contactRes = await fetch('https://www.miregalo.us/contacto/', { cache: 'no-store' });
  const contactHtml = await contactRes.text();
  console.log('\n--- LIVE CONTACTO PAGE ---');
  console.log('Status:', contactRes.status);
  console.log('Includes Envíanos un mensaje:', contactHtml.includes('Envíanos un mensaje'));
  console.log('\n--- LIVE HOME PAGE: LATEST GIFT GUIDES SECTION ---');
  const sectionIdx = html.indexOf('Últimas guías de regalos');
  if (sectionIdx !== -1) {
    const chunk = html.substring(sectionIdx, sectionIdx + 6000);
    const cardRegex = /<article class="card card-standard">[\s\S]*?<\/article>/g;
    const cards = [...chunk.matchAll(cardRegex)];
    console.log(`Found ${cards.length} cards in this section:`);
    cards.forEach((c, i) => {
      const cat = (c[0].match(/<a class="card-taxonomy"[^>]*>([\s\S]*?)<\/a>/) || [])[1]?.trim();
      const title = (c[0].match(/<h3><a[^>]*>([\s\S]*?)<\/a><\/h3>/) || [])[1]?.trim();
      const img = (c[0].match(/<img[^>]*src="([^"]*)"/) || [])[1];
      console.log(`  [Card ${i + 1}] Category: [${cat}] | Title: "${title}"`);
    });
  } else {
    console.log('Section "Últimas guías de regalos" not found in response');
  }

  console.log('\n--- LIVE HOME PAGE: DESDE EL BLOG SECTION ---');
  const blogIdx = html.indexOf('Desde el blog');
  if (blogIdx !== -1) {
    const blogChunk = html.substring(blogIdx, blogIdx + 25000);
    const topicRegex = /<section class="blog-topic">[\s\S]*?<\/section>/g;
    const topics = [...blogChunk.matchAll(topicRegex)];
    console.log(`Found ${topics.length} blog topic columns:`);
    topics.forEach((t, i) => {
      const heading = (t[0].match(/<div class="blog-topic-heading">\s*<h3><a[^>]*>([\s\S]*?)<\/a><\/h3>/) || [])[1]?.trim();
      const firstTitle = (t[0].match(/<h3><a[^>]*>([\s\S]*?)<\/a><\/h3>/g) || [])[1];
      const cleanFirstTitle = firstTitle ? firstTitle.replace(/<[^>]*>/g, '').trim() : '(NO POST)';
      const img = (t[0].match(/<img[^>]*src="([^"]*)"/) || [])[1] || '(NO IMAGE)';
      console.log(`  [Topic ${i + 1}] ${heading} | First: ${cleanFirstTitle} | Img: ${img}`);
    });
    const ulLists = [...blogChunk.matchAll(/<ul class="article-link-list">([\s\S]*?)<\/ul>/g)];
    console.log(`Total sublink lists in blog section: ${ulLists.length}`);
    ulLists.forEach((ul, idx) => {
      const lis = [...ul[1].matchAll(/<li[^>]*><a[^>]*>([\s\S]*?)<\/a><\/li>/g)];
      console.log(`  Column ${idx + 1} sublinks: ${lis.map((l) => l[1].trim()).join(' | ')}`);
    });
  } else {
    console.log('Section "Desde el blog" not found');
  }
}

main().catch(console.error);
