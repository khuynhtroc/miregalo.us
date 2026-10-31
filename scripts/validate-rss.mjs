// Validate RSS feed

async function validateLiveRss() {
  console.log('Fetching live RSS feed from https://www.miregalo.us/rss.xml...');
  const res = await fetch('https://www.miregalo.us/rss.xml');
  console.log('Status:', res.status);
  console.log('Content-Type:', res.headers.get('content-type'));

  const text = await res.text();
  console.log('Length:', text.length, 'bytes');

  // Let's test with native XML parser or check for malformed tags
  // We can write a quick script using node's xml parser or lib
  // Or check for unescaped characters, bad CDATA, etc.

  // Let's check if there are null bytes, unclosed CDATA, unclosed tags
  const cdataOpens = (text.match(/<!\[CDATA\[/g) || []).length;
  const cdataCloses = (text.match(/\]\]>/g) || []).length;
  console.log(`CDATA opens: ${cdataOpens}, closes: ${cdataCloses}`);

  const itemOpens = (text.match(/<item>/g) || []).length;
  const itemCloses = (text.match(/<\/item>/g) || []).length;
  console.log(`Item opens: ${itemOpens}, closes: ${itemCloses}`);

  // Test with xmldom or regex checks
  let hasXmlError = false;
  // Let's check unescaped ampersands outside of CDATA
  // Split by CDATA blocks and inspect outside
  const parts = text.split(/<!\[CDATA\[[\s\S]*?\]\]>/g);
  let badAmpCount = 0;
  parts.forEach((p, idx) => {
    // Check for & not followed by amp;, lt;, gt;, quot;, apos;, or #
    const badAmps = p.match(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g);
    if (badAmps) {
      badAmpCount += badAmps.length;
      console.warn(`Found unescaped '&' in part ${idx}:`, p.slice(0, 100));
    }
  });
  console.log(`Unescaped & outside CDATA: ${badAmpCount}`);

  // Check Pinterest specific requirements:
  // Pinterest RSS requires:
  // 1. <title>
  // 2. <link>
  // 3. <item> with:
  //    - <title>
  //    - <link>
  //    - <description>
  //    - <enclosure url="..." type="image/..."> OR <media:content url="..." medium="image"/>
  //    - <pubDate>

  console.log('\nChecking first 3 items for Pinterest compatibility:');
  const items = text.match(/<item>[\s\S]*?<\/item>/g) || [];
  console.log(`Total items found: ${items.length}`);
  items.slice(0, 3).forEach((item, idx) => {
    const hasTitle = /<title>[\s\S]*?<\/title>/.test(item);
    const hasLink = /<link>[\s\S]*?<\/link>/.test(item);
    const hasDesc = /<description>[\s\S]*?<\/description>/.test(item);
    const hasMedia = /<media:content|<enclosure/.test(item);
    const hasPubDate = /<pubDate>[\s\S]*?<\/pubDate>/.test(item);
    console.log(`Item ${idx + 1}: title=${hasTitle}, link=${hasLink}, desc=${hasDesc}, media=${hasMedia}, pubDate=${hasPubDate}`);
  });
}

validateLiveRss().catch(console.error);
