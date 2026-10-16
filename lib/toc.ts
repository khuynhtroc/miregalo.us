export interface TocItem {
  id: string;
  text: string;
  isSub?: boolean;
}

/**
 * Removes duplicate sections (repeated intro, repeated product cards, repeated FAQs) from content_html
 */
export function cleanContentHtml(
  contentHtml?: string,
  introHtml?: string,
  hasItems?: boolean,
  hasFaqs?: boolean
): string {
  if (!contentHtml) return '';
  let cleaned = contentHtml;

  // 1. Remove duplicate intro at the beginning if contentHtml starts with intro paragraphs before the first <h2>
  if (introHtml) {
    const cleanIntroText = introHtml.replace(/<[^>]+>/g, '').trim().slice(0, 100);
    if (cleanIntroText && cleaned.replace(/<[^>]+>/g, '').startsWith(cleanIntroText)) {
      const firstH2 = cleaned.search(/<h2[^>]*>/i);
      if (firstH2 > 0) {
        cleaned = cleaned.slice(firstH2);
      }
    }
  }

  // 2. Remove duplicate product list section if post already has items rendered via ProductCard
  if (hasItems) {
    cleaned = cleaned.replace(
      /<h2[^>]*>(?:Análisis Detallado|Selección Detallada|Nuestros \d+ Mejores)[\s\S]*?(?=<h2|$)/i,
      ''
    );
  }

  // 3. Remove duplicate FAQ section if post already has faqs rendered via Accordion
  if (hasFaqs) {
    cleaned = cleaned.replace(
      /<h2[^>]*>(?:Preguntas Frecuentes|FAQ)[\s\S]*?(?=<h2|$)/i,
      ''
    );
  }

  return cleaned.trim();
}

/**
 * Cleans repetitive suffixes from item headings (e.g. "– Especial Velas flotantes para halloween")
 */
export function cleanItemHeading(heading?: string): string {
  if (!heading) return '';
  return heading.replace(/\s*[–—-]\s*Especial\s+.*$/i, '').trim();
}

/**
 * Extracts table of contents items from a post (items, headings in content_html, and FAQs).
 */
export function extractTocItems(post: {
  items?: { heading: string }[];
  content_html?: string;
  faqs?: { q: string }[];
}): TocItem[] {
  const list: TocItem[] = [];
  const hasItems = Boolean(post.items && post.items.length > 0);
  const hasFaqs = Boolean(post.faqs && post.faqs.length > 0);

  // 1. Products / Gift Items (if gift guide)
  if (hasItems && post.items) {
    post.items.forEach((item, idx) => {
      const rawHeading = item.heading || `Opción ${idx + 1}`;
      const heading = cleanItemHeading(rawHeading) || `Opción ${idx + 1}`;
      list.push({
        id: `item-${idx + 1}`,
        text: `#${idx + 1} ${heading}`,
        isSub: false,
      });
    });
  }

  // 2. Headings in content_html (e.g. conclusion, buying advice)
  if (post.content_html) {
    const cleanedHtml = cleanContentHtml(post.content_html, undefined, hasItems, hasFaqs);
    const matches = Array.from(cleanedHtml.matchAll(/<h([23])[^>]*>(.*?)<\/h\1>/gi));
    matches.forEach((m, idx) => {
      const level = m[1];
      const rawText = m[2].replace(/<[^>]*>/g, '').trim();
      const lower = rawText.toLowerCase();
      // Skip if it duplicates FAQs or is empty
      if (rawText && !lower.includes('preguntas frecuentes') && !lower.includes('faq')) {
        const slug =
          rawText
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') || `seccion-${idx + 1}`;
        list.push({
          id: slug,
          text: rawText,
          isSub: level === '3',
        });
      }
    });
  }

  // 3. FAQs section if present
  if (hasFaqs) {
    list.push({
      id: 'preguntas-frecuentes',
      text: 'Preguntas frecuentes',
      isSub: false,
    });
  }

  return list;
}
