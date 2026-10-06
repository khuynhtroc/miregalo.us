'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { SiteSettings, Category } from '@/lib/types';

interface HeaderProps {
  settings: SiteSettings;
  categories: Category[];
}

export function Header({ settings, categories }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Group categories for mega menu
  const recipients = categories.filter((c) => c.group === 'recipients' && c.show_in_nav);
  const occasions = categories.filter((c) => c.group === 'occasions' && c.show_in_nav);
  const interests = categories.filter((c) => c.group === 'interests' && c.show_in_nav);
  const blogCats = categories.filter((c) => c.group === 'blog' && c.show_in_nav);

  // Close menus on outside click or escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        setMobileMenuOpen(false);
      }
    }
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const toggleDropdown = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdown(openDropdown === name ? null : name);
  };

  return (
    <header className="site-header">
      <div className="container header-row" ref={navRef}>
        <Link href="/" className="brand brand-header" aria-label={`${settings.site_name} home`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="brand-logo"
            src={settings.logo_url || '/images/miregalo-logo.png'}
            alt={settings.site_name}
            width={1720}
            height={520}
          />
        </Link>

        <button
          className="menu-button"
          type="button"
          aria-expanded={mobileMenuOpen}
          aria-controls="site-nav"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span>Menú</span>
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        <nav
          className="nav"
          id="site-nav"
          aria-label="Navegación principal"
          data-open={mobileMenuOpen ? 'true' : 'false'}
        >
          {/* Mobile search */}
          <div className="mobile-nav-search">
            <form className="site-search site-search-compact" action="/search/" method="get" role="search">
              <label className="sr-only" htmlFor="nav-search">
                Buscar en {settings.site_name}
              </label>
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="m21 21-4.35-4.35m2.35-5.4A7.75 7.75 0 1 1 3.5 11.25a7.75 7.75 0 0 1 15.5 0Z" />
              </svg>
              <input
                id="nav-search"
                type="search"
                name="q"
                placeholder={settings.search_placeholder || 'Buscar ideas de regalos, personas u ocasiones...'}
                autoComplete="off"
              />
              <button type="submit">Buscar</button>
            </form>
          </div>

          {/* Gift Guides Mega Dropdown */}
          <div className="nav-dropdown nav-dropdown-mega" data-open={openDropdown === 'guides' ? 'true' : 'false'}>
            <button
              className="nav-toggle"
              type="button"
              aria-expanded={openDropdown === 'guides'}
              onClick={(e) => toggleDropdown('guides', e)}
            >
              Guías de Regalos
              <svg aria-hidden="true" viewBox="0 0 16 16">
                <path d="m4 6 4 4 4-4" />
              </svg>
            </button>
            <div className="nav-panel mega-panel">
              <div className="mega-intro">
                <span className="eyebrow">Inspiración para regalar</span>
                <strong>Encuentra la idea perfecta para cada persona y momento.</strong>
                <Link href="/regalos/" onClick={() => { setOpenDropdown(null); setMobileMenuOpen(false); }}>
                  Ver el catálogo completo (92 guías) <span aria-hidden="true">→</span>
                </Link>
              </div>

              <div className="mega-group">
                <Link
                  className="mega-heading"
                  href="/destinatarios/"
                  onClick={() => { setOpenDropdown(null); setMobileMenuOpen(false); }}
                >
                  Destinatarios
                </Link>
                <ul>
                  {recipients.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/${c.slug}/`}
                        onClick={() => { setOpenDropdown(null); setMobileMenuOpen(false); }}
                      >
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mega-group">
                <Link
                  className="mega-heading"
                  href="/ocasiones/"
                  onClick={() => { setOpenDropdown(null); setMobileMenuOpen(false); }}
                >
                  Ocasiones
                </Link>
                <ul>
                  {occasions.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/${c.slug}/`}
                        onClick={() => { setOpenDropdown(null); setMobileMenuOpen(false); }}
                      >
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mega-group">
                <Link
                  className="mega-heading"
                  href="/intereses/"
                  onClick={() => { setOpenDropdown(null); setMobileMenuOpen(false); }}
                >
                  Intereses
                </Link>
                <ul>
                  {interests.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/${c.slug}/`}
                        onClick={() => { setOpenDropdown(null); setMobileMenuOpen(false); }}
                      >
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Blog Dropdown */}
          <div className="nav-dropdown" data-open={openDropdown === 'blog' ? 'true' : 'false'}>
            <button
              className="nav-toggle"
              type="button"
              aria-expanded={openDropdown === 'blog'}
              onClick={(e) => toggleDropdown('blog', e)}
            >
              Blog
              <svg aria-hidden="true" viewBox="0 0 16 16">
                <path d="m4 6 4 4 4-4" />
              </svg>
            </button>
            <div className="nav-panel blog-panel">
              <Link
                className="mega-heading"
                href="/blog/"
                onClick={() => { setOpenDropdown(null); setMobileMenuOpen(false); }}
              >
                Explorar el Blog
              </Link>
              {blogCats.map((c) => (
                <Link
                  key={c.id}
                  href={`/${c.slug}/`}
                  onClick={() => { setOpenDropdown(null); setMobileMenuOpen(false); }}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Search link */}
          <Link
            className="nav-search-link"
            href="/search/"
            aria-label={`Buscar en ${settings.site_name}`}
            onClick={() => { setOpenDropdown(null); setMobileMenuOpen(false); }}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="m21 21-4.35-4.35m2.35-5.4A7.75 7.75 0 1 1 3.5 11.25a7.75 7.75 0 0 1 15.5 0Z" />
            </svg>
            <span>Buscar</span>
          </Link>

          {/* Shop button */}
          <a
            className="button nav-shop"
            href={settings.shop_url || '/regalos/'}
          >
            {settings.shop_label || 'Explorar Regalos'}
          </a>
        </nav>
      </div>
    </header>
  );
}
