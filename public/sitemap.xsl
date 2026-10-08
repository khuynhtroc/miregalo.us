<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" 
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="es">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title>Mapa del Sitio XML (XML Sitemap) | Miregalo</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #0f172a;
            padding: 24px 16px;
            line-height: 1.5;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 20px;
            box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08);
            overflow: hidden;
            border: 1px solid #e2e8f0;
          }
          .header {
            background: linear-gradient(135deg, #020617 0%, #0f172a 100%);
            color: #ffffff;
            padding: 32px 28px;
            border-bottom: 4px solid #f59e0b;
          }
          .badge {
            display: inline-block;
            background: #f59e0b;
            color: #020617;
            font-size: 11px;
            font-weight: 900;
            padding: 4px 10px;
            border-radius: 9999px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 12px;
          }
          h1 {
            font-size: 24px;
            font-weight: 900;
            margin-bottom: 8px;
            letter-spacing: -0.02em;
          }
          .desc {
            color: #94a3b8;
            font-size: 13px;
            max-width: 850px;
            line-height: 1.6;
          }
          .controls {
            padding: 20px 28px;
            background: #f1f5f9;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .search-box {
            display: flex;
            align-items: center;
            background: #ffffff;
            border: 2px solid #cbd5e1;
            border-radius: 12px;
            padding: 10px 16px;
            width: 100%;
            transition: all 0.2s;
          }
          .search-box:focus-within {
            border-color: #f59e0b;
            box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
          }
          .search-box input {
            border: none;
            outline: none;
            width: 100%;
            font-size: 14px;
            color: #0f172a;
            font-weight: 500;
          }
          .filter-tabs {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
          .filter-btn {
            background: #ffffff;
            border: 1px solid #cbd5e1;
            padding: 8px 14px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 700;
            color: #475569;
            cursor: pointer;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 6px;
          }
          .filter-btn:hover {
            background: #e2e8f0;
            color: #0f172a;
          }
          .filter-btn.active {
            background: #f59e0b;
            border-color: #f59e0b;
            color: #020617;
          }
          .stats-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            color: #64748b;
            font-weight: 600;
            padding: 0 4px;
          }
          .table-wrapper {
            overflow-x: auto;
            padding: 16px 28px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          th {
            background: #f8fafc;
            color: #475569;
            font-weight: 800;
            text-align: left;
            padding: 12px 14px;
            border-bottom: 2px solid #e2e8f0;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.05em;
          }
          td {
            padding: 12px 14px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: middle;
          }
          tr:hover td {
            background: #fefce8;
          }
          .category-tag {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 11px;
            white-space: nowrap;
          }
          .cat-gift { background: #fef3c7; color: #92400e; }
          .cat-blog { background: #dcfce7; color: #166534; }
          .cat-cat { background: #f3e8ff; color: #6b21a8; }
          .cat-author { background: #dbeafe; color: #1e40af; }
          .cat-page { background: #e0f2fe; color: #0369a1; }
          .url-link {
            color: #0284c7;
            text-decoration: none;
            font-weight: 600;
            word-break: break-all;
          }
          .url-link:hover {
            color: #d97706;
            text-decoration: underline;
          }
          .priority-tag {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 6px;
            font-weight: 800;
            font-size: 11px;
            font-family: monospace;
          }
          .priority-high { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
          .priority-med { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
          .priority-low { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
          .footer {
            padding: 20px 28px;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            font-size: 12px;
            color: #64748b;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 12px;
          }
          .footer a {
            color: #d97706;
            text-decoration: none;
            font-weight: 700;
          }
          .footer a:hover {
            text-decoration: underline;
          }
          .brand-row {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 16px;
          }
          .site-logo {
            height: 48px;
            width: auto;
            max-width: 150px;
            object-fit: contain;
            border-radius: 10px;
            background: #ffffff;
            padding: 4px 8px;
          }
        </style>
        <link rel="icon" type="image/x-icon" href="/favicon.ico"/>
        <link rel="shortcut icon" href="/favicon.ico"/>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="brand-row">
              <a href="https://miregalo.us">
                <img src="/images/miregalo-logo.png" alt="Miregalo" class="site-logo" />
              </a>
              <div>
                <div class="badge">Google &amp; Search Engine Indexing Protocol</div>
                <h1>Mapa del Sitio XML (XML Sitemap)</h1>
              </div>
            </div>
            <p class="desc">
              Estructura completa de direcciones URL del portal Miregalo.us, clasificada de forma interactiva en Guías de Regalos, Artículos de Blog, Categorías y Colecciones, Autores y Páginas para consulta de usuarios y rastreo de motores de búsqueda (Googlebot, Bingbot).
            </p>
          </div>

          <div class="controls">
            <div class="search-box">
              <input type="text" id="searchInput" placeholder="🔍 Buscar enlace o palabra clave (ej: mama, novio, cumpleaños, navidad, blog...)" oninput="filterUrls()" />
            </div>

            <div class="filter-tabs">
              <button class="filter-btn active" onclick="setFilter('all', this)">
                Todos ( <span id="count-all"><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></span> )
              </button>
              <button class="filter-btn" onclick="setFilter('gift', this)">
                🎁 Guías de Regalos ( <span id="count-gift">0</span> )
              </button>
              <button class="filter-btn" onclick="setFilter('blog', this)">
                📰 Artículos de Blog ( <span id="count-blog">0</span> )
              </button>
              <button class="filter-btn" onclick="setFilter('cat', this)">
                📁 Categorías &amp; Hubs ( <span id="count-cat">0</span> )
              </button>
              <button class="filter-btn" onclick="setFilter('author', this)">
                ✍️ Autores ( <span id="count-author">0</span> )
              </button>
              <button class="filter-btn" onclick="setFilter('page', this)">
                🏢 Páginas &amp; Legal ( <span id="count-page">0</span> )
              </button>
            </div>

            <div class="stats-bar">
              <div>Mostrando: <strong id="visibleCount"><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></strong> / <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/> enlaces</div>
              <div>Actualización automática: <strong>24/7</strong></div>
            </div>
          </div>

          <div class="table-wrapper">
            <table id="urlTable">
              <thead>
                <tr>
                  <th style="width: 50px;">Nº</th>
                  <th style="width: 160px;">Clasificación</th>
                  <th>Dirección URL</th>
                  <th style="width: 95px;">Prioridad</th>
                  <th style="width: 110px;">Frecuencia</th>
                  <th style="width: 125px;">Modificación</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sitemap:urlset/sitemap:url">
                  <xsl:variable name="loc" select="sitemap:loc"/>
                  <xsl:variable name="type">
                    <xsl:choose>
                      <xsl:when test="contains($loc, '/author/')">author</xsl:when>
                      <xsl:when test="contains($loc, '/blog/') and not(substring($loc, string-length($loc)-5) = '/blog/')">blog</xsl:when>
                      <xsl:when test="contains($loc, '/regalos') or contains($loc, 'regalo') or contains($loc, 'ideas-') or contains($loc, 'guia')">gift</xsl:when>
                      <xsl:when test="contains($loc, 'politica') or contains($loc, 'privacidad') or contains($loc, 'aviso-legal') or contains($loc, 'contacto') or contains($loc, 'terminos') or contains($loc, 'cookies') or contains($loc, 'faqs') or contains($loc, 'sobre-nosotros')">page</xsl:when>
                      <xsl:when test="contains($loc, '/destinatarios') or contains($loc, '/ocasiones') or contains($loc, '/intereses') or substring($loc, string-length($loc)-5) = '/blog/'">cat</xsl:when>
                      <xsl:otherwise>gift</xsl:otherwise>
                    </xsl:choose>
                  </xsl:variable>

                  <tr data-type="{$type}" data-url="{$loc}">
                    <td style="color: #94a3b8; font-weight: bold; font-family: monospace;">
                      <xsl:value-of select="position()"/>
                    </td>
                    <td>
                      <xsl:choose>
                        <xsl:when test="$type = 'gift'">
                          <span class="category-tag cat-gift">🎁 Guía de Regalo</span>
                        </xsl:when>
                        <xsl:when test="$type = 'blog'">
                          <span class="category-tag cat-blog">📰 Artículo de Blog</span>
                        </xsl:when>
                        <xsl:when test="$type = 'cat'">
                          <span class="category-tag cat-cat">📁 Categoría</span>
                        </xsl:when>
                        <xsl:when test="$type = 'author'">
                          <span class="category-tag cat-author">✍️ Autor</span>
                        </xsl:when>
                        <xsl:otherwise>
                          <span class="category-tag cat-page">🏢 Página</span>
                        </xsl:otherwise>
                      </xsl:choose>
                    </td>
                    <td>
                      <a class="url-link" href="{$loc}" target="_blank">
                        <xsl:value-of select="$loc"/>
                      </a>
                    </td>
                    <td>
                      <xsl:variable name="p" select="sitemap:priority"/>
                      <span>
                        <xsl:attribute name="class">
                          <xsl:choose>
                            <xsl:when test="$p &gt;= 0.8">priority-tag priority-high</xsl:when>
                            <xsl:when test="$p &gt;= 0.6">priority-tag priority-med</xsl:when>
                            <xsl:otherwise>priority-tag priority-low</xsl:otherwise>
                          </xsl:choose>
                        </xsl:attribute>
                        <xsl:value-of select="sitemap:priority"/>
                      </span>
                    </td>
                    <td style="text-transform: capitalize; color: #64748b; font-size: 12px; font-weight: 600;">
                      <xsl:value-of select="sitemap:changefreq"/>
                    </td>
                    <td style="color: #64748b; font-family: monospace; font-size: 12px;">
                      <xsl:value-of select="substring(sitemap:lastmod, 0, 11)"/>
                    </td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>
          </div>

          <div class="footer">
            <div>
              Sitio web oficial: <a href="https://miregalo.us">miregalo.us</a> • Contacto: <strong>contacto@miregalo.us</strong>
            </div>
            <div>
              Canal de contenidos: <a href="/rss.xml">RSS Feed 2.0</a>
            </div>
          </div>
        </div>

        <script>
          <![CDATA[
          let currentType = 'all';

          const CATEGORY_SLUGS = new Set([
            'regalos', 'destinatarios', 'ocasiones', 'intereses', 'blog', 'para-mujeres', 'para-mama',
            'para-hombres', 'para-ninos-y-adolescentes', 'para-amigos', 'para-papa', 'para-parejas',
            'para-todos', 'bodas', 'san-valentin', 'nueva-casa', 'halloween', 'graduacion',
            'navidad', 'cumpleanos', 'aniversario', 'populares', 'deportes-y-aire-libre',
            'animales', 'relaciones', 'frases', 'fiestas', 'familia', 'eventos'
          ]);

          const PAGE_SLUGS = new Set([
            '', 'sobre-nosotros', 'faqs', 'contacto', 'politica-de-privacidad',
            'terminos-y-condiciones', 'politica-de-cookies', 'divulgacion-de-afiliados',
            'quienes-somos', 'aviso-legal'
          ]);

          function classifyUrl(url) {
            try {
              const u = new URL(url);
              const path = u.pathname.replace(/^\/|\/$/g, '');
              if (!path) return 'page';
              if (path.startsWith('author/')) return 'author';
              if (path === 'blog') return 'cat';
              if (path.startsWith('blog/')) return 'blog';
              if (CATEGORY_SLUGS.has(path)) return 'cat';
              if (PAGE_SLUGS.has(path)) return 'page';
              return 'gift';
            } catch (e) {
              if (url.includes('/author/')) return 'author';
              if (url.includes('/blog/') && !url.endsWith('/blog/')) return 'blog';
              if (url.endsWith('/blog/') || url.includes('/destinatarios/') || url.includes('/ocasiones/')) return 'cat';
              return 'gift';
            }
          }

          function initSitemap() {
            const rows = document.querySelectorAll('#urlTable tbody tr');
            const counts = { all: rows.length, gift: 0, blog: 0, cat: 0, author: 0, page: 0 };

            rows.forEach(r => {
              const url = r.getAttribute('data-url') || '';
              const t = classifyUrl(url);
              r.setAttribute('data-type', t);

              const badgeCell = r.querySelector('.category-tag');
              if (badgeCell) {
                badgeCell.className = 'category-tag cat-' + t;
                if (t === 'gift') badgeCell.innerHTML = '🎁 Guía de Regalo';
                else if (t === 'blog') badgeCell.innerHTML = '📰 Artículo de Blog';
                else if (t === 'cat') badgeCell.innerHTML = '📁 Categoría &amp; Hub';
                else if (t === 'author') badgeCell.innerHTML = '✍️ Autor';
                else if (t === 'page') badgeCell.innerHTML = '🏢 Página &amp; Legal';
              }

              if (counts[t] !== undefined) counts[t]++;
            });

            const setVal = (id, val) => {
              const el = document.getElementById(id);
              if (el) el.innerText = val.toLocaleString('es-ES');
            };
            setVal('count-all', counts.all);
            setVal('count-gift', counts.gift);
            setVal('count-blog', counts.blog);
            setVal('count-cat', counts.cat);
            setVal('count-author', counts.author);
            setVal('count-page', counts.page);

            const vis = document.getElementById('visibleCount');
            if (vis) vis.innerText = counts.all.toLocaleString('es-ES');
          }

          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initSitemap);
          } else {
            initSitemap();
          }

          function setFilter(type, el) {
            currentType = type;
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            el.classList.add('active');
            filterUrls();
          }

          function filterUrls() {
            const query = (document.getElementById('searchInput').value || '').toLowerCase().trim();
            const rows = document.querySelectorAll('#urlTable tbody tr');
            let count = 0;

            rows.forEach(row => {
              const rowType = row.getAttribute('data-type');
              const rowUrl = (row.getAttribute('data-url') || '').toLowerCase();
              const matchesType = (currentType === 'all' || rowType === currentType);
              const matchesSearch = !query || rowUrl.includes(query);

              if (matchesType && matchesSearch) {
                row.style.display = '';
                count++;
              } else {
                row.style.display = 'none';
              }
            });

            const vis = document.getElementById('visibleCount');
            if (vis) vis.innerText = count.toLocaleString('es-ES');
          }
          ]]>
        </script>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
