'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Category } from '@/lib/types';
import type { SearchResponse, SearchResultPost } from '@/lib/search';

interface SearchPageClientProps {
  initialData: SearchResponse;
  popularCategories: Category[];
  allCategories: Category[];
  siteName: string;
  googleSearchCx?: string;
}

export function SearchPageClient({
  initialData,
  popularCategories,
  allCategories,
  siteName,
  googleSearchCx,
}: SearchPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchMode, setSearchMode] = useState<'internal' | 'google'>('internal');
  const [googleQuery, setGoogleQuery] = useState('');

  const [query, setQuery] = useState(initialData.query);
  const [activeType, setActiveType] = useState<string>(searchParams.get('type') || 'all');
  const [activeTopic, setActiveTopic] = useState<string>(searchParams.get('topic') || '');
  const [data, setData] = useState<SearchResponse>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  // Accordion states
  const [isContentTypeOpen, setIsContentTypeOpen] = useState(true);
  const [isTopicOpen, setIsTopicOpen] = useState(true);

  // Inject Google Custom Search Engine script when configured
  useEffect(() => {
    if (googleSearchCx && typeof window !== 'undefined') {
      const existing = document.getElementById('google-cse-script');
      if (!existing) {
        const script = document.createElement('script');
        script.id = 'google-cse-script';
        script.async = true;
        script.src = `https://cse.google.com/cse.js?cx=${googleSearchCx}`;
        document.head.appendChild(script);
      }
    }
  }, [googleSearchCx]);

  // Sync state when URL search params change
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const t = searchParams.get('type') || 'all';
    const top = searchParams.get('topic') || '';
    setQuery(q);
    setActiveType(t);
    setActiveTopic(top);
    if (q) {
      executeSearch(q, t, top);
    } else {
      setData({
        query: '',
        total: 0,
        page: 1,
        perPage: 20,
        totalPages: 0,
        rows: [],
        counts: { all: 0, gift: 0, blog: 0 },
        topics: [],
      });
    }
  }, [searchParams]);

  const executeSearch = async (q: string, t: string, top: string, page = 1) => {
    if (!q.trim()) {
      setData({
        query: '',
        total: 0,
        page: 1,
        perPage: 20,
        totalPages: 0,
        rows: [],
        counts: { all: 0, gift: 0, blog: 0 },
        topics: [],
      });
      return;
    }

    setIsLoading(true);
    try {
      const sp = new URLSearchParams();
      sp.set('q', q.trim());
      if (t && t !== 'all') sp.set('type', t);
      if (top) sp.set('topic', top);
      if (page > 1) sp.set('page', String(page));

      const res = await fetch(`/api/search?${sp.toString()}`);
      if (res.ok) {
        const json: SearchResponse = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const sp = new URLSearchParams();
    sp.set('q', query.trim());
    if (activeType && activeType !== 'all') sp.set('type', activeType);
    if (activeTopic) sp.set('topic', activeTopic);
    router.push(`/search/?${sp.toString()}`);
  };

  const handleGoogleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = googleQuery.trim() || query.trim();
    if (!q) return;
    // Direct Google search restricted to this website
    const googleUrl = `https://www.google.com/search?q=site:miregalo.us+${encodeURIComponent(q)}`;
    window.open(googleUrl, '_blank', 'noopener,noreferrer');
  };

  const handleClear = () => {
    setQuery('');
    setActiveType('all');
    setActiveTopic('');
    router.push('/search/');
  };

  const handleTypeSelect = (typeVal: string) => {
    setActiveType(typeVal);
    const sp = new URLSearchParams(searchParams.toString());
    if (typeVal === 'all') sp.delete('type');
    else sp.set('type', typeVal);
    sp.delete('page');
    router.push(`/search/?${sp.toString()}`);
  };

  const handleTopicSelect = (topicSlug: string) => {
    const nextTopic = activeTopic === topicSlug ? '' : topicSlug;
    setActiveTopic(nextTopic);
    const sp = new URLSearchParams(searchParams.toString());
    if (!nextTopic) sp.delete('topic');
    else sp.set('topic', nextTopic);
    sp.delete('page');
    router.push(`/search/?${sp.toString()}`);
  };

  const getPostUrl = (post: SearchResultPost) => {
    if (post.type === 'blog') return `/blog/${post.slug}/`;
    return `/${post.slug}/`;
  };

  const catMap = new Map(allCategories.map((c) => [c.id, c]));

  return (
    <div className="search-experience">
      {/* ─── Hero Section ─── */}
      <section className="search-hero-v2">
        <div className="container search-hero-inner-v2">
          <h1 className="search-hero-title">¿Qué estás buscando?</h1>
          <p className="search-hero-subtitle">
            Busca en cada guía de regalos y artículo por persona, ocasión o idea.
          </p>

          {/* Search Mode Switcher Tabs */}
          <div className="search-mode-tabs" role="tablist">
            <button
              type="button"
              className={`search-mode-tab ${searchMode === 'internal' ? 'active' : ''}`}
              onClick={() => setSearchMode('internal')}
              role="tab"
              aria-selected={searchMode === 'internal'}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m21 21-4.35-4.35m2.35-5.4A7.75 7.75 0 1 1 3.5 11.25a7.75 7.75 0 0 1 15.5 0Z" />
              </svg>
              <span>Búsqueda en {siteName}</span>
            </button>
            <button
              type="button"
              className={`search-mode-tab ${searchMode === 'google' ? 'active' : ''}`}
              onClick={() => setSearchMode('google')}
              role="tab"
              aria-selected={searchMode === 'google'}
            >
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Búsqueda con Google</span>
            </button>
          </div>

          {searchMode === 'internal' ? (
            /* Native Search Bar */
            <form className="search-hero-form" onSubmit={handleHeroSubmit} role="search">
              <div className="search-hero-bar">
                <svg className="search-icon" aria-hidden="true" viewBox="0 0 24 24">
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-4.35-4.35m2.35-5.4A7.75 7.75 0 1 1 3.5 11.25a7.75 7.75 0 0 1 15.5 0Z"
                  />
                </svg>
                <input
                  type="search"
                  className="search-hero-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar ideas de regalos, personas u ocasiones..."
                  autoComplete="off"
                  aria-label="Buscar"
                />
                <button type="submit" className="search-hero-btn">
                  Buscar
                </button>
              </div>
            </form>
          ) : (
            /* Google Search Engine Component */
            <div className="google-search-panel">
              <form className="search-hero-form" onSubmit={handleGoogleSubmit} role="search">
                <div className="search-hero-bar google-hero-bar">
                  <svg viewBox="0 0 24 24" width="20" height="20" style={{ marginRight: '10px', flexShrink: 0 }}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <input
                    type="search"
                    className="search-hero-input"
                    value={googleQuery || query}
                    onChange={(e) => setGoogleQuery(e.target.value)}
                    placeholder="Buscar en miregalo.us con la tecnología de Google..."
                    autoComplete="off"
                    aria-label="Buscar con Google"
                  />
                  <button type="submit" className="search-hero-btn google-btn">
                    Buscar en Google
                  </button>
                </div>
              </form>

              {/* Embedded Google Programmable Search element (if CX provided) */}
              <div className="google-cse-container" style={{ marginTop: '20px' }}>
                <div className="gcse-search"></div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── Results / Main Section ─── */}
      <div className="container search-content-container">
        {data.query ? (
          <div className="search-active-layout">
            {/* Secondary Active Search Bar with Clear button */}
            <div className="search-active-query-bar">
              <div className="search-active-pill">
                <svg className="search-icon-sm" aria-hidden="true" viewBox="0 0 24 24">
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-4.35-4.35m2.35-5.4A7.75 7.75 0 1 1 3.5 11.25a7.75 7.75 0 0 1 15.5 0Z"
                  />
                </svg>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleHeroSubmit(e);
                  }}
                  className="search-active-input"
                  aria-label="Término actual"
                />
                <button
                  type="button"
                  onClick={handleClear}
                  className="search-clear-btn"
                  title="Borrar búsqueda"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="search-columns">
              {/* ─── Left Sidebar Filters ─── */}
              <aside className="search-sidebar">
                {/* Content Type Filter */}
                <div className="filter-group">
                  <button
                    type="button"
                    className="filter-heading"
                    onClick={() => setIsContentTypeOpen(!isContentTypeOpen)}
                    aria-expanded={isContentTypeOpen}
                  >
                    <span>Content type</span>
                    <svg
                      className={`filter-chevron ${isContentTypeOpen ? 'open' : ''}`}
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                    >
                      <path
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m6 9 6 6 6-6"
                      />
                    </svg>
                  </button>

                  {isContentTypeOpen && (
                    <div className="filter-options">
                      <label className="filter-option">
                        <input
                          type="radio"
                          name="content_type"
                          checked={activeType === 'all'}
                          onChange={() => handleTypeSelect('all')}
                        />
                        <span className="filter-label">Todas ({data.counts.all})</span>
                      </label>
                      <label className="filter-option">
                        <input
                          type="radio"
                          name="content_type"
                          checked={activeType === 'gift'}
                          onChange={() => handleTypeSelect('gift')}
                        />
                        <span className="filter-label">
                          Guías de regalos ({data.counts.gift})
                        </span>
                      </label>
                      <label className="filter-option">
                        <input
                          type="radio"
                          name="content_type"
                          checked={activeType === 'blog'}
                          onChange={() => handleTypeSelect('blog')}
                        />
                        <span className="filter-label">Blog ({data.counts.blog})</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Topic Filter */}
                {data.topics.length > 0 && (
                  <div className="filter-group">
                    <button
                      type="button"
                      className="filter-heading"
                      onClick={() => setIsTopicOpen(!isTopicOpen)}
                      aria-expanded={isTopicOpen}
                    >
                      <span>Topic</span>
                      <svg
                        className={`filter-chevron ${isTopicOpen ? 'open' : ''}`}
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                      >
                        <path
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m6 9 6 6 6-6"
                        />
                      </svg>
                    </button>

                    {isTopicOpen && (
                      <div className="filter-options filter-options-scroll">
                        {data.topics.map((t) => (
                          <label key={t.id} className="filter-option">
                            <input
                              type="checkbox"
                              checked={activeTopic === t.slug || activeTopic === t.id}
                              onChange={() => handleTopicSelect(t.slug)}
                            />
                            <span className="filter-label">
                              {t.name} ({t.count})
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </aside>

              {/* ─── Right Results List ─── */}
              <main className="search-results-main">
                <div className="search-results-header">
                  <p className="search-results-count">
                    {data.total}{' '}
                    {data.total === 1 ? 'resultado' : 'resultados'} para{' '}
                    <strong>{data.query}</strong>
                    {isLoading && <span className="search-loading-spinner" />}
                  </p>
                </div>

                {data.rows.length > 0 ? (
                  <div className="search-results-list">
                    {data.rows.map((post) => {
                      const primaryCat = post.primary_category_id
                        ? catMap.get(post.primary_category_id)
                        : (post.category_ids[0] ? catMap.get(post.category_ids[0]) : null);
                      const postUrl = getPostUrl(post);

                      return (
                        <article key={post.id} className="search-result-row">
                          <div className="search-result-info">
                            <h2 className="search-result-title">
                              <Link href={postUrl}>
                                <HighlightText text={post.title} query={data.query} />
                              </Link>
                            </h2>

                            {primaryCat && (
                              <p className="search-result-category">
                                <span>{post.type === 'blog' ? 'Blog' : 'Regalos'}</span>
                                <span className="breadcrumb-sep">&gt;</span>
                                <Link href={`/${primaryCat.slug}/`}>{primaryCat.name}</Link>
                              </p>
                            )}

                            {/* Matching sub-items (from Gift Guides) */}
                            {post.matchedItems && post.matchedItems.length > 0 ? (
                              <div className="search-sub-results">
                                {post.matchedItems.map((item) => (
                                  <div key={item.index} className="search-sub-item">
                                    <div className="search-sub-heading">
                                      <span className="sub-arrow">↳</span>
                                      <strong>
                                        <HighlightText
                                          text={`${item.index} ${item.heading}`}
                                          query={data.query}
                                        />
                                      </strong>
                                    </div>
                                    {item.snippet && (
                                      <p className="search-sub-snippet">
                                        <HighlightText text={item.snippet} query={data.query} />
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              post.excerpt && (
                                <p className="search-result-excerpt">
                                  <HighlightText text={post.excerpt} query={data.query} />
                                </p>
                              )
                            )}
                          </div>

                          {post.hero_image && (
                            <div className="search-result-media">
                              <Link href={postUrl} tabIndex={-1} aria-hidden="true">
                                <img
                                  src={post.hero_image}
                                  alt={post.hero_alt || post.title}
                                  loading="lazy"
                                  className="search-result-thumb"
                                />
                              </Link>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="search-empty-state">
                    <h3>No se encontraron resultados para &ldquo;{data.query}&rdquo;</h3>
                    <p>
                      Prueba con términos más generales como &ldquo;aniversario&rdquo;,
                      &ldquo;cumpleaños&rdquo;, &ldquo;novia&rdquo; o &ldquo;navidad&rdquo;.
                    </p>
                    <div style={{ marginTop: '20px' }}>
                      <Link href="/regalos/" className="button">
                        Explorar todas las guías de regalos
                      </Link>
                    </div>
                  </div>
                )}
              </main>
            </div>
          </div>
        ) : (
          /* When no query is entered yet */
          <div className="search-idle-topics">
            <div className="section-heading">
              <div>
                <p className="eyebrow">¿No sabes por dónde empezar?</p>
                <h2 className="section-title">Explorar temas populares</h2>
              </div>
            </div>

            <div className="search-topic-links">
              {popularCategories.map((cat) => (
                <Link key={cat.id} href={`/${cat.slug}/`}>
                  <span>{cat.name}</span>
                  <span aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Highlight matching terms with <mark className="search-highlight"> */
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query || !text) return <>{text}</>;

  const tokens = query
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 1)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (!tokens.length) return <>{text}</>;

  // Regex matching tokens case-insensitively
  const regex = new RegExp(`(${tokens.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="search-highlight">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}
