'use client';

import { useEffect, useState } from 'react';

interface TocItem {
  id: string;
  text: string;
  isSub: boolean;
}

export function TableOfContents() {
  const [items, setItems] = useState<TocItem[]>([]);

  useEffect(() => {
    const article = document.querySelector('.article-content');
    if (!article) return;

    const headings = Array.from(article.querySelectorAll('h2, h3'));
    if (headings.length < 2) return;

    const seenIds = new Set<string>();
    const list: TocItem[] = [];

    headings.forEach((heading, idx) => {
      let slug =
        heading.id ||
        (heading.textContent || '')
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') ||
        `section-${idx + 1}`;

      const base = slug;
      let counter = 2;
      while (seenIds.has(slug)) {
        slug = `${base}-${counter++}`;
      }
      seenIds.add(slug);
      heading.id = slug;

      list.push({
        id: slug,
        text: heading.textContent || '',
        isSub: heading.tagName.toLowerCase() === 'h3',
      });
    });

    setItems(list);
  }, []);

  if (items.length < 2) return null;

  return (
    <nav className="table-of-contents" data-toc aria-label="Índice de contenidos">
      <p className="aside-title">En este artículo</p>
      <ol data-toc-list>
        {items.map((item) => (
          <li key={item.id} className={item.isSub ? 'toc-subitem' : ''}>
            <a href={`#${item.id}`}>{item.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
