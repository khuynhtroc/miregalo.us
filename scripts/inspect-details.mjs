async function inspectDetailed() {
  const url = 'https://blog.loveable.us/wooden-anniversary-gifts/';
  const res = await fetch(url);
  const html = await res.text();
  
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["'](.*?)["']/i);
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["'](.*?)["']/i);
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i);
  
  // Extract item cards
  const itemMatches = [...html.matchAll(/<h2[^>]*class=["'][^"']*item-heading[^"']*["'][^>]*>([\s\S]*?)<\/h2>/gi)];
  
  console.log('Title:', titleMatch ? titleMatch[1] : '');
  console.log('Desc:', descMatch ? descMatch[1] : '');
  console.log('OgImage:', ogImageMatch ? ogImageMatch[1] : '');
  console.log('Canonical:', canonicalMatch ? canonicalMatch[1] : '');
  console.log('Item headings count:', itemMatches.length);
  if (itemMatches.length > 0) {
    console.log('Sample item headings:');
    itemMatches.slice(0, 5).forEach((m, i) => {
      console.log(`  ${i + 1}:`, m[1].replace(/<[^>]+>/g, '').trim());
    });
  }

  // Also check if JSON-LD is on the page
  const jsonLdMatches = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  console.log('JSON-LD scripts count:', jsonLdMatches.length);
  for (let i = 0; i < jsonLdMatches.length; i++) {
    try {
      const parsed = JSON.parse(jsonLdMatches[i][1]);
      console.log(`JSON-LD #${i + 1} @type:`, parsed['@type']);
      if (parsed['@type'] === 'BlogPosting' || parsed['@type'] === 'Article') {
        console.log('  headline:', parsed.headline);
        console.log('  datePublished:', parsed.datePublished);
        console.log('  author:', parsed.author);
      }
    } catch (e) {
      console.log(`JSON-LD #${i + 1} parse error:`, e.message);
    }
  }
}
inspectDetailed();
