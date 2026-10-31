'use client';

import { useEffect } from 'react';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Disable Google Analytics tracking for all tags on admin routes
      try {
        Object.keys(window).forEach((key) => {
          if (key.startsWith('ga-disable-')) {
            (window as any)[key] = true;
          }
        });
      } catch (_) {}
    }
  }, []);

  return <>{children}</>;
}
