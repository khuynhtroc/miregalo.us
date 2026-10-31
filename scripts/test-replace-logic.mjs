const sample = `<h2 id="quotes-2024" class="wp-block-heading">Las mejores citas 2024</h2>
<p>En el año 2024 y 2025 vimos cosas.</p>
<img class="wp-image-2024" src="https://media.miregalo.us/media/uploads/2024/01/pic.jpg" alt="Foto de Halloween 2024" srcset="https://media.miregalo.us/media/uploads/2024/01/pic-960x960.jpg 960w" />
<a href="https://media.miregalo.us/uploads/2024/doc.pdf">Ver guía 2024</a>`;

export function updateYearsInText(str) {
  if (!str || typeof str !== 'string') return str;
  return str.replace(/\b202[45]\b/g, '2026');
}

export function updateYearsInHtml(html) {
  if (!html || typeof html !== 'string') return html;

  // 1. Replace inside text nodes between > and <
  let res = html.replace(/>([^<]+)</g, (match, text) => {
    return '>' + text.replace(/\b202[45]\b/g, '2026') + '<';
  });

  // 2. Replace inside heading IDs (id="...")
  res = res.replace(/id="([^"]*?)\b202[45]\b([^"]*?)"/g, (match, before, after) => {
    return `id="${before}2026${after}"`;
  });

  // 3. Replace inside alt attributes (alt="...")
  res = res.replace(/alt="([^"]*?)\b202[45]\b([^"]*?)"/g, (match, before, after) => {
    return `alt="${before}2026${after}"`;
  });

  return res;
}

const updated = updateYearsInHtml(sample);
console.log('--- ORIGINAL ---');
console.log(sample);
console.log('\n--- UPDATED ---');
console.log(updated);

// Assertions:
console.log('\n--- VERIFICATION ---');
console.log('1. Heading text replaced:', updated.includes('Las mejores citas 2026'));
console.log('2. Heading ID replaced:', updated.includes('id="quotes-2026"'));
console.log('3. Paragraph text replaced:', updated.includes('En el año 2026 y 2026 vimos cosas.'));
console.log('4. Alt text replaced:', updated.includes('alt="Foto de Halloween 2026"'));
console.log('5. Link text replaced:', updated.includes('>Ver guía 2026<'));
console.log('6. src URL PRESERVED (MUST BE TRUE):', updated.includes('src="https://media.miregalo.us/media/uploads/2024/01/pic.jpg"'));
console.log('7. srcset URL PRESERVED (MUST BE TRUE):', updated.includes('srcset="https://media.miregalo.us/media/uploads/2024/01/pic-960x960.jpg 960w"'));
console.log('8. href URL PRESERVED (MUST BE TRUE):', updated.includes('href="https://media.miregalo.us/uploads/2024/doc.pdf"'));
console.log('9. class="wp-image-2024" PRESERVED (MUST BE TRUE):', updated.includes('class="wp-image-2024"'));
