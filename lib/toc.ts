export interface TocItem {
  id: string;
  text: string;
  isSub?: boolean;
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

  // 1. Products / Gift Items (if gift guide)
  if (post.items && post.items.length > 0) {
    post.items.forEach((item, idx) => {
      const heading = item.heading || `Opción ${idx + 1}`;
      list.push({
        id: `item-${idx + 1}`,
        text: `#${idx + 1} ${heading}`,
        isSub: false,
      });
    });
  }

  // 2. Headings in content_html (e.g. conclusion, buying advice)
  if (post.content_html) {
    const matches = Array.from(post.content_html.matchAll(/<h([23])[^>]*>(.*?)<\/h\1>/gi));
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
  if (post.faqs && post.faqs.length > 0) {
    list.push({
      id: 'preguntas-frecuentes',
      text: 'Preguntas frecuentes',
      isSub: false,
    });
  }

  return list;
}
