import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
      <header className="site-header">
        <div className="container header-row">
          <Link href="/" className="brand brand-header">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="brand-logo"
              src="/images/miregalo-logo.png"
              alt="Miregalo"
              width={1720}
              height={520}
            />
          </Link>
          <div style={{ marginLeft: 'auto' }}>
            <Link href="/" className="button">
              Volver al inicio
            </Link>
          </div>
        </div>
      </header>

      <section className="not-found-hero" style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <div className="container not-found-inner">
          <div className="not-found-code">404</div>
          <div>
            <p className="eyebrow">¿Te has perdido entre los regalos?</p>
            <h1>Página no encontrada</h1>
            <p className="lead">
              La página que buscas no existe, ha sido movida o el enlace puede estar roto.
            </p>
            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <Link href="/" className="button">
                Explorar guías de regalos
              </Link>
              <Link href="/search/" className="button button-light">
                Buscar guías
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
