async function inspectItemHtml() {
  const url = 'https://blog.loveable.us/wooden-anniversary-gifts/';
  const res = await fetch(url);
  const html = await res.text();
  
  // Find where the first item starts
  const firstItemIdx = html.indexOf('class="product-item-row');
  if (firstItemIdx !== -1) {
    console.log('Found product-item-row!');
    console.log(html.slice(firstItemIdx, firstItemIdx + 2000));
  } else {
    // Check other class names
    console.log('Searching for other item containers...');
    const match = html.match(/<h2[^>]*class=["'][^"']*item-heading[^"']*["'][^>]*>[\s\S]*?<\/h2>/i);
    if (match) {
      console.log('Found item-heading:');
      const start = match.index;
      console.log(html.slice(start - 200, start + 1500));
    }
  }
}
inspectItemHtml();
