<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" 
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:media="http://search.yahoo.com/mrss/">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="es">
      <head>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <title><xsl:value-of select="/rss/channel/title"/> | RSS Feed 2.0</title>
        <link rel="icon" type="image/x-icon" href="/favicon.ico"/>
        <link rel="shortcut icon" href="/favicon.ico"/>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #0f172a;
            padding: 32px 16px;
            line-height: 1.6;
          }
          .container {
            max-width: 960px;
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
          .brand-row {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 20px;
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
            margin-bottom: 8px;
          }
          h1 {
            font-size: 22px;
            font-weight: 900;
            margin-bottom: 8px;
            letter-spacing: -0.02em;
          }
          .desc {
            color: #94a3b8;
            font-size: 13px;
            margin-bottom: 16px;
            line-height: 1.6;
          }
          .feed-meta {
            font-size: 12px;
            color: #cbd5e1;
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
          }
          .feed-meta span {
            background: rgba(255, 255, 255, 0.1);
            padding: 4px 10px;
            border-radius: 6px;
          }
          .controls {
            padding: 16px 28px;
            background: #f1f5f9;
            border-bottom: 1px solid #e2e8f0;
          }
          .search-box input {
            width: 100%;
            padding: 10px 16px;
            border-radius: 10px;
            border: 1px solid #cbd5e1;
            font-size: 13px;
            background: #ffffff;
            outline: none;
            transition: all 0.2s;
          }
          .search-box input:focus {
            border-color: #f59e0b;
            box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
          }
          .items-list {
            padding: 28px;
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          .item-card {
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 20px 24px;
            background: #ffffff;
            transition: all 0.2s ease;
          }
          .item-card:hover {
            border-color: #f59e0b;
            box-shadow: 0 6px 16px rgba(245, 158, 11, 0.08);
            transform: translateY(-1px);
          }
          .item-thumb-wrapper {
            margin-bottom: 14px;
            border-radius: 10px;
            overflow: hidden;
            max-height: 240px;
            background: #f8fafc;
          }
          .item-thumb {
            width: 100%;
            height: 220px;
            object-fit: cover;
            display: block;
          }
          .item-cat {
            display: inline-block;
            background: #fef3c7;
            color: #92400e;
            font-size: 11px;
            font-weight: 800;
            padding: 3px 8px;
            border-radius: 6px;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.03em;
          }
          .item-title {
            font-size: 17px;
            font-weight: 800;
            margin-bottom: 8px;
            line-height: 1.4;
          }
          .item-title a {
            color: #0f172a;
            text-decoration: none;
          }
          .item-title a:hover {
            color: #d97706;
          }
          .item-desc {
            font-size: 13px;
            color: #475569;
            margin-bottom: 14px;
            line-height: 1.6;
          }
          .item-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px dashed #e2e8f0;
            padding-top: 12px;
            flex-wrap: wrap;
            gap: 8px;
          }
          .read-more {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            color: #d97706;
            font-weight: 700;
            text-decoration: none;
          }
          .read-more:hover {
            text-decoration: underline;
          }
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
            color: #f59e0b;
            text-decoration: none;
            font-weight: 700;
          }
          .footer a:hover {
            text-decoration: underline;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="brand-row">
              <a href="https://www.miregalo.us">
                <img src="/images/miregalo-logo.png" alt="Miregalo" class="site-logo" />
              </a>
              <div>
                <div class="badge">Canal de Contenidos RSS 2.0 Estandarizado</div>
                <h1><xsl:value-of select="/rss/channel/title"/></h1>
              </div>
            </div>
            <p class="desc"><xsl:value-of select="/rss/channel/description"/></p>
            <div class="feed-meta">
              <span>Idioma: <xsl:value-of select="/rss/channel/language"/></span>
              <span>Total publicaciones: <xsl:value-of select="count(/rss/channel/item)"/></span>
              <span>Corte: <xsl:value-of select="/rss/channel/lastBuildDate"/></span>
            </div>
          </div>

          <div class="controls">
            <div class="search-box">
              <input type="text" id="rssSearch" placeholder="🔍 Filtrar publicaciones por palabra clave en tiempo real..." oninput="filterRss()" />
            </div>
          </div>

          <div class="items-list" id="itemsList">
            <xsl:for-each select="/rss/channel/item">
              <div class="item-card">
                <xsl:choose>
                  <xsl:when test="media:content/@url">
                    <div class="item-thumb-wrapper">
                      <img class="item-thumb" src="{media:content/@url}" loading="lazy" />
                    </div>
                  </xsl:when>
                  <xsl:when test="enclosure/@url">
                    <div class="item-thumb-wrapper">
                      <img class="item-thumb" src="{enclosure/@url}" loading="lazy" />
                    </div>
                  </xsl:when>
                </xsl:choose>
                <xsl:if test="category">
                  <div class="item-cat"><xsl:value-of select="category"/></div>
                </xsl:if>
                <div class="item-title">
                  <a href="{link}" target="_blank"><xsl:value-of select="title"/></a>
                </div>
                <div class="item-desc">
                  <xsl:value-of select="description"/>
                </div>
                <div class="item-footer">
                  <div>
                    Fecha: <xsl:value-of select="pubDate"/>
                    <xsl:if test="dc:creator">
                      &#160;•&#160;Autor: <xsl:value-of select="dc:creator"/>
                    </xsl:if>
                  </div>
                  <a class="read-more" href="{link}" target="_blank">Leer artículo completo →</a>
                </div>
              </div>
            </xsl:for-each>
          </div>

          <div class="footer">
            <div>
              Sitio web: <a href="https://miregalo.us">miregalo.us</a> • Contacto: <strong>contacto@miregalo.us</strong>
            </div>
            <div>
              Mapa del sitio: <a href="/sitemap.xml">XML Sitemap</a>
            </div>
          </div>
        </div>

        <script>
          <![CDATA[
          function filterRss() {
            var input = document.getElementById('rssSearch');
            var filter = input ? input.value.toLowerCase().trim() : '';
            var cards = document.getElementsByClassName('item-card');
            for (var i = 0; i < cards.length; i++) {
              var text = cards[i].innerText.toLowerCase();
              cards[i].style.display = (!filter || text.indexOf(filter) !== -1) ? '' : 'none';
            }
          }
          ]]>
        </script>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
