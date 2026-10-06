'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout/', { method: 'POST' });
    router.push('/admin/login/');
    router.refresh();
  };

  const navItems = [
    { href: '/admin/', label: 'Dashboard', icon: '📊' },
    { href: '/admin/urls/', label: 'URL Catalog (92)', icon: '🗺️' },
    { href: '/admin/keywords/', label: 'Keywords (500)', icon: '🎯' },
    { href: '/admin/clusters/', label: 'Clusters', icon: '🔍' },
    { href: '/admin/gsc/', label: 'GSC & SEO Opportunities', icon: '📈' },
    { href: '/admin/jobs/', label: 'Content Jobs Queue', icon: '⚙️' },
    { href: '/admin/posts/', label: 'Articles & Guides', icon: '📝' },
    { href: '/admin/pages/', label: 'Pages (FAQs, Policy...)', icon: '📄' },
    { href: '/admin/media/', label: 'Media & Cloud Storage', icon: '📁' },
    { href: '/admin/affiliate-links/', label: 'Affiliate Networks & Sync', icon: '🔗' },
    { href: '/admin/products/', label: 'Affiliate Products', icon: '🛍️' },
    { href: '/admin/merchants/', label: 'Merchants & Networks', icon: '🏪' },
    { href: '/admin/generator/', label: 'AI Generator Studio', icon: '⚡' },
    { href: '/admin/categories/', label: 'Categories', icon: '🗂️' },
    { href: '/admin/authors/', label: 'Authors', icon: '✍️' },
    { href: '/admin/redirects/', label: 'Redirects', icon: '🔀' },
    { href: '/admin/settings/', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <nav className="admin-nav">
      {navItems.map((item) => {
        const isActive =
          item.href === '/admin/'
            ? pathname === '/admin/' || pathname === '/admin'
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={isActive ? 'active' : ''}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}

      <button
        onClick={handleLogout}
        style={{
          marginTop: 'auto',
          background: 'none',
          border: 'none',
          color: '#f87171',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 14px',
          borderRadius: '8px',
          fontSize: '0.88rem',
          fontWeight: 500,
          cursor: 'pointer',
          textAlign: 'left',
          width: '100%',
        }}
      >
        <span>🚪</span>
        <span>Sign Out</span>
      </button>
    </nav>
  );
}
