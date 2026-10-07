'use client';

import { useEffect, useState, useId } from 'react';
import type { TocItem } from '@/lib/toc';

interface TableOfContentsProps {
  items?: TocItem[];
  title?: string;
  variant?: 'aside' | 'inline';
}

export function TableOfContents({ items: propItems, title, variant = 'aside' }: TableOfContentsProps) {
  const [items, setItems] = useState<TocItem[]>(propItems || []);
  const [activeId, setActiveId] = useState<string>('');
  const uniqueId = useId();

  // If items weren't provided via props, extract them dynamically from DOM
  useEffect(() => {
    if (propItems && propItems.length > 0) {
      setItems(propItems);
      // Ensure content_html headings have matching IDs on the DOM
      propItems.forEach((it) => {
        if (!document.getElementById(it.id)) {
          // Find heading with matching text
          const headings = document.querySelectorAll('h2, h3');
          for (const h of headings) {
            if ((h.textContent || '').trim().toLowerCase() === it.text.toLowerCase()) {
              h.id = it.id;
              break;
            }
          }
        }
      });
      return;
    }

    const container =
      document.querySelector('.article-main') ||
      document.querySelector('article') ||
      document.querySelector('.article-content');
    if (!container) return;

    // Look for all product cards and h2/h3 headings
    const elements = Array.from(
      container.querySelectorAll('.product-card[id], h2, h3')
    );
    if (elements.length < 2) return;

    const seenIds = new Set<string>();
    const list: TocItem[] = [];

    elements.forEach((el, idx) => {
      // If it's a product card with id like item-1
      if (el.classList.contains('product-card')) {
        const titleEl = el.querySelector('.product-horizontal-title, .product-card-title');
        const headingText = (titleEl?.textContent || '').trim();
        const cardId = el.id || `item-${idx + 1}`;
        if (!seenIds.has(cardId) && headingText) {
          seenIds.add(cardId);
          list.push({
            id: cardId,
            text: `#${list.length + 1} ${headingText}`,
            isSub: false,
          });
        }
        return;
      }

      // Skip headings inside product cards as they are already handled
      if (el.closest('.product-card')) return;

      const rawText = (el.textContent || '').trim();
      if (!rawText) return;

      let slug =
        el.id ||
        rawText
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') ||
        `seccion-${idx + 1}`;

      const base = slug;
      let counter = 2;
      while (seenIds.has(slug)) {
        slug = `${base}-${counter++}`;
      }
      seenIds.add(slug);
      el.id = slug;

      list.push({
        id: slug,
        text: rawText,
        isSub: el.tagName.toLowerCase() === 'h3',
      });
    });

    if (list.length >= 2) {
      setItems(list);
    }
  }, [propItems]);

  // Track active section on scroll
  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0,
      }
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  // ─────────────────────────────────────────────────────────────
  // 1. IN-ARTICLE INLINE VARIANT (Visible on Mobile & In Reading Flow)
  // ─────────────────────────────────────────────────────────────
  if (variant === 'inline') {
    return (
      <details className="in-article-toc" open>
        <summary className="in-article-toc-summary">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>📋</span>
            <span style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--ink)' }}>
              {title || `Índice de contenidos (${items.length} ideas)`}
            </span>
          </div>
          <span
            className="in-article-toc-toggle"
            style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 500 }}
          >
            Mostrar / Ocultar ▾
          </span>
        </summary>
        <div className="in-article-toc-body">
          <p style={{ margin: '0 0 14px', fontSize: '0.86rem', color: 'var(--muted)' }}>
            Haz clic en cualquier opción para ir directamente al regalo o sección:
          </p>
          <div className="in-article-toc-grid">
            {items.map((item, idx) => {
              const isItem = item.id.startsWith('item-');
              const numMatch = item.text.match(/^#(\d+)\s*/);
              const displayNumber = numMatch ? numMatch[1] : (isItem ? item.id.replace('item-', '') : `${idx + 1}`);
              const cleanText = item.text.replace(/^#\d+\s*/, '');

              return (
                <a
                  key={`${uniqueId}-${item.id}`}
                  href={`#${item.id}`}
                  className="in-article-toc-link"
                >
                  <span className="in-article-toc-idx">{isItem ? `#${displayNumber}` : '•'}</span>
                  <span className="in-article-toc-text" title={cleanText}>
                    {cleanText}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </details>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. ASIDE SIDEBAR VARIANT (Sticky Desktop Navigation)
  // ─────────────────────────────────────────────────────────────
  return (
    <nav className="table-of-contents" data-toc aria-label="Índice de contenidos">
      <p className="aside-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>📑</span>
        <span>{title || 'En este artículo'}</span>
      </p>
      <ol data-toc-list>
        {items.map((item) => (
          <li key={item.id} className={item.isSub ? 'toc-subitem' : ''}>
            <a
              href={`#${item.id}`}
              className={activeId === item.id ? 'is-active' : ''}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
