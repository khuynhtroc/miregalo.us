'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'miregalo_cookie_consent';

export function CookieBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      // Delay slightly for smooth entrance
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }

    // Listen for custom event to reopen preferences anytime from footer
    const handleReopen = () => setIsOpen(true);
    window.addEventListener('miregalo:open-cookie-banner', handleReopen);
    return () => window.removeEventListener('miregalo:open-cookie-banner', handleReopen);
  }, []);

  const handleConsent = (choice: 'accepted' | 'essential') => {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // localStorage may fail in private mode
    }
    setIsOpen(false);
  };

  if (!mounted || !isOpen) return null;

  return (
    <aside
      className="cookie-banner-wrapper"
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de privacidad y cookies"
    >
      <div className="cookie-banner-card">
        <div className="cookie-banner-header">
          <div className="cookie-banner-title">
            <span className="cookie-emoji" aria-hidden="true">🍪</span>
            <strong>Tu privacidad en Miregalo</strong>
          </div>
          <button
            type="button"
            className="cookie-close-btn"
            onClick={() => handleConsent('essential')}
            aria-label="Cerrar aviso de cookies"
          >
            ✕
          </button>
        </div>

        <p className="cookie-banner-text">
          Utilizamos cookies propias y de terceros (incluyendo servicios de analítica y el{' '}
          <strong>Programa de Afiliados de Amazon</strong>) para garantizar el funcionamiento de la web, medir
          visitas y ofrecerte recomendaciones de regalos personalizadas. Puedes aceptar todas las cookies o
          mantener solo las indispensables para la navegación.{' '}
          <Link href="/politica-de-cookies/" className="cookie-policy-link">
            Leer Política de Cookies
          </Link>.
        </p>

        <div className="cookie-banner-actions">
          <button
            type="button"
            className="cookie-btn cookie-btn-primary"
            onClick={() => handleConsent('accepted')}
          >
            Aceptar todas
          </button>
          <button
            type="button"
            className="cookie-btn cookie-btn-secondary"
            onClick={() => handleConsent('essential')}
          >
            Solo necesarias
          </button>
          <Link href="/politica-de-cookies/" className="cookie-btn cookie-btn-link">
            Configurar
          </Link>
        </div>
      </div>
    </aside>
  );
}
