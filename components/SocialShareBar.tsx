'use client';

import { useState } from 'react';

interface SocialShareBarProps {
  url: string;
  title: string;
  media?: string;
  label?: string;
}

export function SocialShareBar({ url, title, media, label = 'Compartir este artículo:' }: SocialShareBarProps) {
  const [copied, setCopied] = useState(false);

  const cleanUrl = url.startsWith('http') ? url : `https://www.miregalo.us${url.startsWith('/') ? '' : '/'}${url}`;
  const cleanMedia = media
    ? (media.startsWith('http') ? media : `https://www.miregalo.us${media.startsWith('/') ? '' : '/'}${media}`)
    : 'https://www.miregalo.us/images/miregalo-logo.png';

  const pinterestUrl = `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(cleanUrl)}&media=${encodeURIComponent(cleanMedia)}&description=${encodeURIComponent(title)}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + cleanUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(cleanUrl)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(cleanUrl)}&text=${encodeURIComponent(title)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cleanUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const openPopup = (shareUrl: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    window.open(shareUrl, '_blank', 'width=600,height=500,scrollbars=yes,resizable=yes');
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '14px 18px',
        margin: '24px 0',
        background: '#fff',
        border: '1px solid var(--line, #f0f0f4)',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '1rem' }} aria-hidden="true">📣</span>
        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--ink, #1f2937)' }}>
          {label}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {/* Pinterest Pin Button */}
        <a
          href={pinterestUrl}
          onClick={openPopup(pinterestUrl)}
          target="_blank"
          rel="noopener noreferrer"
          title="Guardar en Pinterest"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            backgroundColor: '#e60023',
            color: '#fff',
            borderRadius: '20px',
            fontSize: '0.84rem',
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'transform 0.15s ease, opacity 0.15s ease',
            boxShadow: '0 2px 6px rgba(230, 0, 35, 0.25)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.92')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
          </svg>
          <span>Guardar</span>
        </a>

        {/* WhatsApp */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Compartir en WhatsApp"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#25D366',
            color: '#fff',
            textDecoration: 'none',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.698.077-2.18-.541-.839-.349-1.379-.691-1.89-1.201-.51-.51-.852-1.05-1.201-1.89-.618-1.482-.586-1.868-.541-2.18.05-.333.419-1.026.824-1.17.135-.048.283-.024.385.068.172.155.617 1.487.674 1.636.058.149.034.304-.057.412-.092.109-.173.161-.264.264-.092.103-.197.218-.081.425.228.406.666.983 1.155 1.472.489.489 1.066.927 1.472 1.155.207.116.322.011.425-.081.103-.091.155-.172.264-.264.108-.091.263-.115.412-.057.149.057 1.481.502 1.636.674.092.102.116.25.068.385z" />
          </svg>
        </a>

        {/* Facebook */}
        <a
          href={facebookUrl}
          onClick={openPopup(facebookUrl)}
          target="_blank"
          rel="noopener noreferrer"
          title="Compartir en Facebook"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#1877F2',
            color: '#fff',
            textDecoration: 'none',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </a>

        {/* X / Twitter */}
        <a
          href={twitterUrl}
          onClick={openPopup(twitterUrl)}
          target="_blank"
          rel="noopener noreferrer"
          title="Compartir en X"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#0f1419',
            color: '#fff',
            textDecoration: 'none',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>

        {/* Copy Link Button */}
        <button
          onClick={handleCopy}
          type="button"
          title="Copiar enlace"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            borderRadius: '20px',
            border: '1px solid #d1d5db',
            backgroundColor: copied ? '#ecfdf5' : '#f9fafb',
            color: copied ? '#059669' : '#4b5563',
            fontSize: '0.82rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <span>{copied ? '✓ Copiado' : '🔗 Copiar'}</span>
        </button>
      </div>
    </div>
  );
}
