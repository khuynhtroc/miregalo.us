'use client';

import { useEffect, useRef } from 'react';

interface AdBannerProps {
  variant: 'in-article' | 'in-feed' | 'sidebar' | 'multiplex';
  slotId?: string;
  clientId?: string;
  className?: string;
}

export function AdBanner({
  variant,
  slotId,
  clientId = 'ca-pub-2959580292222970',
  className = '',
}: AdBannerProps) {
  const adRef = useRef<HTMLModElement | null>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    // Only push if not already pushed and adsbygoogle is available in window
    if (!pushedRef.current && typeof window !== 'undefined') {
      try {
        const win = window as any;
        win.adsbygoogle = win.adsbygoogle || [];
        win.adsbygoogle.push({});
        pushedRef.current = true;
      } catch (e) {
        // Silently catch adblock or push errors
        console.warn('[AdSense] Push notice:', e);
      }
    }
  }, []);

  // Style variations based on placement
  let containerStyle: React.CSSProperties = {
    margin: '32px 0',
    textAlign: 'center',
    background: '#fafbfc',
    border: '1px solid #edf0f5',
    borderRadius: '12px',
    padding: '16px 12px 12px',
    overflow: 'hidden',
    position: 'relative',
  };

  let minHeight = '280px';
  let format = 'auto';

  if (variant === 'in-article') {
    containerStyle = {
      ...containerStyle,
      margin: '40px auto',
      maxWidth: '768px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
    };
    minHeight = '280px';
  } else if (variant === 'in-feed') {
    containerStyle = {
      ...containerStyle,
      margin: '28px 0',
      background: '#ffffff',
      border: '1px solid #fee2e2',
      boxShadow: '0 4px 12px rgba(225, 29, 72, 0.04)',
    };
    minHeight = '250px';
    format = 'fluid';
  } else if (variant === 'sidebar') {
    containerStyle = {
      ...containerStyle,
      margin: '24px 0 0 0',
      position: 'sticky',
      top: '90px',
      minHeight: '600px',
      background: '#ffffff',
      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
    };
    minHeight = '600px';
    format = 'vertical';
  } else if (variant === 'multiplex') {
    containerStyle = {
      ...containerStyle,
      margin: '44px 0',
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
    };
    minHeight = '320px';
    format = 'autorelaxed';
  }

  return (
    <div
      className={`adsense-wrapper adsense-${variant} ${className}`}
      style={containerStyle}
      data-ad-variant={variant}
    >
      {/* Policy requirement: Noticeable advertisement disclaimer label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          marginBottom: '8px',
          fontSize: '0.68rem',
          fontWeight: 600,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#94a3b8',
        }}
      >
        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>📢</span>
        <span>Publicidad</span>
      </div>

      <div style={{ minHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', minHeight }}
          data-ad-client={clientId}
          {...(slotId ? { 'data-ad-slot': slotId } : {})}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
