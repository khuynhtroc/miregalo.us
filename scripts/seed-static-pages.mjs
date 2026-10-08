import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const url = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const supabase = createClient(url, key);

const pages = [
  {
    id: 'page-faqs',
    type: 'page',
    slug: 'faqs',
    title: 'Preguntas Frecuentes (FAQs)',
    excerpt: 'Respuestas claras a las dudas más comunes sobre las recomendaciones, personalizaciones y compras en Miregalo.',
    intro_html: '<p>Encuentra aquí respuesta a las preguntas más frecuentes sobre nuestra plataforma, cómo seleccionamos los regalos y cómo funcionan los enlaces a tiendas asociadas.</p>',
    content_html: `
      <h2>¿Cómo funciona Miregalo?</h2>
      <p>Miregalo es una plataforma editorial y guía de compras especializada en ideas de regalos para toda persona, relación y ocasión. Analizamos miles de productos, tendencias y opiniones para recomendar exclusivamente regalos de calidad, originales y con alto valor emocional.</p>

      <h2>¿Tienen algún coste adicional los enlaces de compra?</h2>
      <p><strong>Absolutamente no.</strong> Cuando compras a través de un enlace de Miregalo en tiendas oficiales como Amazon o El Corte Inglés, el precio para ti es exactamente el mismo (e incluso disfrutas de las mismas ofertas y promociones vigentes). En algunos casos, nosotros recibimos una pequeña comisión por parte de la tienda asociada, lo que nos permite mantener nuestro contenido 100% gratuito e independiente.</p>

      <h2>¿Puedo personalizar los regalos recomendados?</h2>
      <p>¡Sí! Una gran parte de nuestras recomendaciones son artículos personalizables: grabados de nombres, mapas estelares con fechas memorables, álbumes con fotos y dedicatorias exclusivas. En cada guía te indicamos claramente las opciones de personalización que ofrece el fabricante o vendedor.</p>

      <h2>¿Quién gestiona el envío y las devoluciones?</h2>
      <p>La compra, el cobro, el empaquetado y el envío son gestionados directamente por el comercio vendedor (por ejemplo, Amazon España, marcas oficiales o tiendas de confianza). Por tanto, cuentas con todas las garantías de envío rápido, seguimiento de paquete y políticas de devolución oficiales de cada tienda.</p>

      <h2>¿Cómo eligen los regalos que aparecen en las guías?</h2>
      <p>Nuestro equipo editorial sigue criterios rigurosos: valoraciones positivas de compradores reales, calidad de materiales, reputación del vendedor, originalidad y significado emocional del detalle. No aceptamos pagos por incluir productos que no cumplan nuestros estándares de calidad.</p>

      <h2>¿Cómo puedo contactar si tengo una consulta?</h2>
      <p>Puedes escribirnos en cualquier momento a través de nuestra <a href="/contacto/">página de contacto</a> o directamente por email a <strong>contacto@miregalo.us</strong>. Nuestro equipo te responderá en menos de 24-48 horas laborables.</p>
    `,
    faqs: [
      {
        q: '¿Los precios que veo en Miregalo son finales?',
        a: 'Los precios mostrados corresponden al momento de la publicación de la guía. Dado que los comercios pueden modificar sus tarifas o lanzar promociones temporales, te recomendamos comprobar siempre el precio final en la tienda del vendedor.'
      },
      {
        q: '¿Miregalo vende productos directamente?',
        a: 'Miregalo es un medio editorial de recomendaciones y curaduría de regalos. No almacenamos stock ni realizamos envíos propios; te conectamos de forma segura con las mejores tiendas y fabricantes oficiales.'
      },
      {
        q: '¿Cómo garantizan la seguridad de mis datos al comprar?',
        a: 'Toda transacción económica se realiza en las plataformas de pago certificadas y seguras de las tiendas oficiales (como Amazon, eBay o pasarelas SSL bancarias). Miregalo nunca solicita ni almacena datos de tarjetas de crédito.'
      },
      {
        q: '¿Puedo sugerir una idea de regalo para que la analicen?',
        a: '¡Por supuesto! Nos encanta recibir sugerencias de nuestra comunidad. Escríbenos a contacto@miregalo.us con tu propuesta.'
      }
    ],
    hero_image: '',
    hero_alt: 'Preguntas Frecuentes Miregalo',
    primary_category_id: null,
    category_ids: [],
    author_id: null,
    status: 'published',
    featured: false,
    editor_pick: false,
    focus_keyword: 'preguntas frecuentes miregalo',
    seo_title: 'Preguntas Frecuentes (FAQs) | Miregalo',
    seo_description: 'Resuelve tus dudas sobre cómo funciona Miregalo, selección de regalos, enlaces de compra y garantías de tiendas asociadas.',
    canonical_url: 'https://www.miregalo.us/faqs/',
    robots: 'index, follow',
    og_image: '/images/miregalo-logo-fullsize.png',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'page-contacto',
    type: 'page',
    slug: 'contacto',
    title: 'Contacto y Soporte',
    excerpt: '¿Tienes alguna duda, sugerencia o propuesta de colaboración? El equipo de Miregalo está a tu disposición.',
    intro_html: '<p>Nos encanta escuchar a nuestros lectores y colaboradores. Si necesitas ayuda para elegir un regalo, quieres reportar un enlace caído o estás interesado en una colaboración editorial, contáctanos a continuación.</p>',
    content_html: `
      <h2>Canales de Atención</h2>
      <p>Puedes comunicarte con nosotros por cualquiera de las siguientes vías:</p>
      <ul>
        <li><strong>Correo electrónico principal:</strong> <a href="mailto:contacto@miregalo.us">contacto@miregalo.us</a></li>
        <li><strong>Consultas editoriales y prensa:</strong> <a href="mailto:editorial@miregalo.us">editorial@miregalo.us</a></li>
        <li><strong>Horario de atención:</strong> Lunes a Viernes de 9:00 a 18:00 (CET)</li>
        <li><strong>Tiempo estimado de respuesta:</strong> Entre 24 y 48 horas laborables</li>
      </ul>

      <h2>Preguntas Frecuentes Rápidas</h2>
      <p>Antes de escribirnos, te invitamos a consultar nuestra sección de <a href="/faqs/">Preguntas Frecuentes</a>, donde encontrarás respuesta inmediata sobre envíos, garantías y enlaces de compra.</p>

      <h2>Colaboraciones y Marcas</h2>
      <p>Si eres artesano, diseñador o representas a una marca con productos de regalo únicos y deseas que nuestro equipo evalúe tus artículos para futuras guías temáticas, envíanos tu dossier y catálogo a <strong>contacto@miregalo.us</strong> indicando en el asunto "Propuesta Editorial - [Nombre de tu Marca]".</p>
    `,
    faqs: [],
    hero_image: '',
    hero_alt: 'Contacto Miregalo',
    primary_category_id: null,
    category_ids: [],
    author_id: null,
    status: 'published',
    featured: false,
    editor_pick: false,
    focus_keyword: 'contacto miregalo',
    seo_title: 'Contacto y Soporte | Miregalo',
    seo_description: 'Ponte en contacto con el equipo de Miregalo para consultas, sugerencias de regalos o propuestas de colaboración editorial.',
    canonical_url: 'https://www.miregalo.us/contacto/',
    robots: 'index, follow',
    og_image: '/images/miregalo-logo-fullsize.png',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'page-politica-de-privacidad',
    type: 'page',
    slug: 'politica-de-privacidad',
    title: 'Política de Privacidad',
    excerpt: 'Información transparente sobre el tratamiento y la protección de tus datos personales en Miregalo según el RGPD.',
    intro_html: '<p>En Miregalo respetamos tu privacidad y nos comprometemos a proteger tus datos personales. Esta Política explica qué datos tratamos, con qué fin y qué derechos te asisten.</p>',
    content_html: `
      <h2>1. Responsable del Tratamiento</h2>
      <p>El portal web <strong>Miregalo</strong> (disponible en <a href="https://miregalo.us">https://miregalo.us</a>) es operado conforme a la legislación europea de protección de datos (RGPD 2016/679) y normativas internacionales aplicables. Para cualquier cuestión relativa a la privacidad, puedes escribir a <a href="mailto:privacidad@miregalo.us">privacidad@miregalo.us</a>.</p>

      <h2>2. Datos Personales que Recopilamos</h2>
      <p>Podemos recopilar y tratar las siguientes categorías de datos:</p>
      <ul>
        <li><strong>Datos de navegación técnica:</strong> Dirección IP anonimizada, tipo de navegador, sistema operativo, páginas visitadas y tiempos de permanencia recopilados a través de herramientas de analítica (Google Analytics 4).</li>
        <li><strong>Datos facilitados voluntariamente:</strong> Nombre y dirección de correo electrónico cuando nos envías un mensaje a través del formulario de contacto o comentarios.</li>
      </ul>

      <h2>3. Finalidad y Base Jurídica del Tratamiento</h2>
      <p>Tratamos tus datos con las siguientes finalidades:</p>
      <ul>
        <li><strong>Atender tus consultas y mensajes:</strong> Legitimado por tu consentimiento explícito al contactarnos.</li>
        <li><strong>Mejorar la experiencia de usuario y medir el rendimiento del sitio:</strong> Mediante estadísticas agregadas y anónimas amparadas en nuestro interés legítimo y en tu consentimiento de cookies analíticas.</li>
        <li><strong>Seguridad del sitio web:</strong> Prevenir ataques informáticos y garantizar la disponibilidad del servicio.</li>
      </ul>

      <h2>4. Enlaces de Afiliados y Sitios Web de Terceros</h2>
      <p>Miregalo contiene enlaces a sitios web de terceros (como Amazon, eBay, El Corte Inglés, entre otros). Al pulsar en dichos enlaces, eres redirigido a las plataformas de dichos comercios, las cuales cuentan con sus propias políticas de privacidad y condiciones de servicio independientes. Te recomendamos revisar sus respectivas políticas al visitarlos.</p>

      <h2>5. Conservación de los Datos</h2>
      <p>Los datos derivados de comunicaciones por email se conservarán durante el tiempo necesario para resolver tu solicitud y, posteriormente, durante los plazos legalmente exigibles. Los datos estadísticos analíticos se conservan de forma agregada y disociada.</p>

      <h2>6. Tus Derechos como Usuario</h2>
      <p>Conforme al RGPD, tienes derecho a:</p>
      <ul>
        <li>Acceder a los datos personales que conservamos sobre ti.</li>
        <li>Solicitar la rectificación de datos inexactos o la supresión de los mismos.</li>
        <li>Solicitar la limitación u oponerte al tratamiento de tus datos.</li>
        <li>Retirar tu consentimiento en cualquier momento.</li>
      </ul>
      <p>Para ejercer cualquiera de estos derechos, envía un correo electrónico a <strong>privacidad@miregalo.us</strong> adjuntando una prueba de tu identidad.</p>

      <h2>7. Modificaciones de esta Política</h2>
      <p>Miregalo se reserva el derecho a actualizar esta Política de Privacidad para adaptarla a novedades legislativas o mejoras técnicas. Cualquier cambio será publicado en esta misma página con indicación de su fecha de última actualización.</p>
    `,
    faqs: [],
    hero_image: '',
    hero_alt: 'Política de Privacidad Miregalo',
    primary_category_id: null,
    category_ids: [],
    author_id: null,
    status: 'published',
    featured: false,
    editor_pick: false,
    focus_keyword: 'politica de privacidad miregalo',
    seo_title: 'Política de Privacidad | Miregalo',
    seo_description: 'Conoce cómo Miregalo protege y gestiona tus datos personales de acuerdo con el Reglamento General de Protección de Datos (RGPD).',
    canonical_url: 'https://www.miregalo.us/politica-de-privacidad/',
    robots: 'index, follow',
    og_image: '/images/miregalo-logo-fullsize.png',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'page-terminos-y-condiciones',
    type: 'page',
    slug: 'terminos-y-condiciones',
    title: 'Términos y Condiciones de Uso',
    excerpt: 'Condiciones generales que regulan el acceso, navegación y uso del portal web Miregalo.',
    intro_html: '<p>Te damos la bienvenida a Miregalo. Por favor, lee atentamente estos Términos y Condiciones que rigen el uso de nuestro sitio web.</p>',
    content_html: `
      <h2>1. Objeto y Ámbito de Aplicación</h2>
      <p>El presente documento establece las condiciones de uso de la web <strong>Miregalo</strong> (<a href="https://miregalo.us">https://miregalo.us</a>). El acceso y uso de este portal atribuye la condición de Usuario e implica la aceptación plena de todos los términos aquí recogidos.</p>

      <h2>2. Carácter Informativo del Contenido</h2>
      <p>El contenido ofrecido en Miregalo tiene finalidad exclusivamente informativa, de inspiración y de recomendación editorial de regalos y productos de consumo. Aunque ponemos el máximo cuidado en mantener la información actualizada, los precios, stock y características de los artículos dependen de los comercios terceros vendedores y pueden variar sin previo aviso.</p>

      <h2>3. Relación con Tiendas Terceras y Afiliación</h2>
      <p>Miregalo participa en diversos programas de afiliados comerciales (incluyendo el Programa de Afiliados de Amazon EU, Awin, entre otros). Esto significa que podemos recibir una comisión por las compras válidas realizadas a través de los enlaces de nuestro portal, sin que ello suponga coste adicional alguno para el comprador.</p>
      <p><strong>Miregalo no es vendedor ni distribuidor directo:</strong> Las relaciones comerciales, pagos, envíos, garantías y posibles reclamaciones se formalizan única y exclusivamente entre el usuario y la tienda de destino.</p>

      <h2>4. Propiedad Intelectual e Industrial</h2>
      <p>Todos los textos, logotipos, diseños, código fuente, estructuras de categorías y contenidos propios alojados en Miregalo están protegidos por las leyes de propiedad intelectual e industrial. Queda prohibida su reproducción, distribución o comunicación pública sin autorización previa por escrito.</p>

      <h2>5. Responsabilidad del Usuario</h2>
      <p>El usuario se compromete a hacer un uso lícito y diligente de la web, absteniéndose de introducir virus, bots o cualquier programa informático que pueda alterar o dañar los sistemas del sitio web o de terceros.</p>

      <h2>6. Legislación Aplicable y Jurisdicción</h2>
      <p>Para la resolución de cualquier controversia o cuestión litigiosa relativa a este sitio web, será de aplicación la normativa vigente en España y la Unión Europea.</p>
    `,
    faqs: [],
    hero_image: '',
    hero_alt: 'Términos y Condiciones Miregalo',
    primary_category_id: null,
    category_ids: [],
    author_id: null,
    status: 'published',
    featured: false,
    editor_pick: false,
    focus_keyword: 'terminos y condiciones miregalo',
    seo_title: 'Términos y Condiciones de Uso | Miregalo',
    seo_description: 'Consulta los términos y condiciones que regulan el uso, recomendaciones editoriales y navegación en Miregalo.',
    canonical_url: 'https://www.miregalo.us/terminos-y-condiciones/',
    robots: 'index, follow',
    og_image: '/images/miregalo-logo-fullsize.png',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'page-politica-de-cookies',
    type: 'page',
    slug: 'politica-de-cookies',
    title: 'Política de Cookies',
    excerpt: 'Información detallada sobre el uso de cookies propias y de terceros en Miregalo y cómo administrarlas.',
    intro_html: '<p>Esta Política de Cookies explica qué son las cookies, cómo las utilizamos en Miregalo y cómo puedes configurarlas o desactivarlas en tu navegador.</p>',
    content_html: `
      <h2>1. ¿Qué son las Cookies?</h2>
      <p>Las cookies son pequeños archivos de texto que los sitios web descargan en tu navegador cuando navegas por ellos. Permiten a la página web recordar información sobre tu visita (como tu idioma de preferencia u opciones de visualización) para hacer tu próxima visita más cómoda y eficiente.</p>

      <h2>2. ¿Qué tipos de cookies utiliza Miregalo?</h2>
      <ul>
        <li><strong>Cookies técnicas esenciales:</strong> Necesarias para el correcto funcionamiento de la navegación, acceso al panel de administración y seguridad.</li>
        <li><strong>Cookies analíticas (Google Analytics 4):</strong> Nos ayudan a entender cómo interactúan los usuarios con nuestras guías (páginas más visitadas, tiempos de lectura, dispositivos utilizados) de forma agregada y totalmente anónima, con la finalidad de mejorar continuamente el contenido.</li>
        <li><strong>Cookies de seguimiento de afiliados:</strong> Al hacer clic en un botón de producto que te redirige a una tienda asociada (por ejemplo, Amazon o Awin), se genera una cookie de corta duración que permite al comercio saber que la visita provino de Miregalo para asignarnos la comisión correspondiente si decides comprar.</li>
      </ul>

      <h2>3. Cómo desactivar o eliminar cookies</h2>
      <p>Puedes permitir, bloquear o eliminar las cookies instaladas en tu equipo mediante la configuración de las opciones del navegador que utilices:</p>
      <ul>
        <li><strong>Google Chrome:</strong> Configuración &gt; Privacidad y seguridad &gt; Cookies y otros datos de sitios.</li>
        <li><strong>Mozilla Firefox:</strong> Opciones &gt; Privacidad y seguridad &gt; Cookies y datos del sitio.</li>
        <li><strong>Safari:</strong> Preferencias &gt; Privacidad &gt; Bloquear todas las cookies.</li>
        <li><strong>Microsoft Edge:</strong> Configuración &gt; Permisos del sitio &gt; Cookies y datos del sitio.</li>
      </ul>
      <p>Ten en cuenta que si bloqueas las cookies técnicas esenciales, algunas funcionalidades de la navegación podrían verse limitadas.</p>
    `,
    faqs: [],
    hero_image: '',
    hero_alt: 'Política de Cookies Miregalo',
    primary_category_id: null,
    category_ids: [],
    author_id: null,
    status: 'published',
    featured: false,
    editor_pick: false,
    focus_keyword: 'politica de cookies miregalo',
    seo_title: 'Política de Cookies | Miregalo',
    seo_description: 'Descubre qué cookies utilizamos en Miregalo, su propósito y cómo puedes gestionarlas o desactivarlas fácilmente.',
    canonical_url: 'https://www.miregalo.us/politica-de-cookies/',
    robots: 'index, follow',
    og_image: '/images/miregalo-logo-fullsize.png',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'page-sobre-nosotros',
    type: 'page',
    slug: 'sobre-nosotros',
    title: 'Sobre Nosotros',
    excerpt: 'Conoce la misión y filosofía de Miregalo: transformar la búsqueda de regalos en una experiencia cercana e inspiradora.',
    intro_html: '<p>En Miregalo creemos que un regalo no es solo un objeto: es un mensaje de afecto, un recuerdo imborrable y la forma más bella de celebrar a quienes más queremos.</p>',
    content_html: `
      <h2>Nuestra Misión</h2>
      <p>Encontrar el regalo ideal puede ser una tarea estresante ante el exceso de opciones y productos sin alma en internet. <strong>Miregalo</strong> nació con un propósito claro: filtrar el ruido digital para ofrecerte únicamente recomendaciones de regalos auténticas, emotivas, prácticas y de máxima calidad.</p>

      <h2>Nuestros Principios Editoriales</h2>
      <ul>
        <li><strong>Curaduría experta:</strong> Cada guía es elaborada tras un exhaustivo análisis de cientos de opciones, valoraciones de compradores reales y pruebas de usabilidad.</li>
        <li><strong>Énfasis en la personalización:</strong> Damos prioridad a regalos con detalles únicos —grabados personalizados, fechas señaladas, álbumes de recuerdos— porque sabemos que lo emotivo perdura en el tiempo.</li>
        <li><strong>Transparencia total:</strong> Explicamos con honestidad las ventajas, los materiales y el público idóneo para cada producto. Nuestra opinión editorial nunca se ve alterada por acuerdos comerciales.</li>
        <li><strong>Cero coste extra:</strong> Si decides comprar a través de nuestros enlaces recomendados, el precio que pagas es exactamente el mismo de la tienda oficial.</li>
      </ul>

      <h2>¿Quién forma Miregalo?</h2>
      <p>Somos un equipo apasionado de redactores, diseñadores y especialistas en tendencias de estilo de vida con base en España y Latinoamérica. Nos mueve la ilusión de ayudarte a arrancar una sonrisa sincera a esa persona especial en su cumpleaños, aniversario, boda o festividad.</p>

      <h2>Únete a Nuestra Comunidad</h2>
      <p>Explora nuestras más de 1.600 guías y artículos en el <a href="/regalos/">Catálogo de Regalos</a> o lee nuestros consejos de relaciones y dedicatorias en el <a href="/blog/">Blog</a>. ¡Bienvenido a la familia Miregalo!</p>
    `,
    faqs: [],
    hero_image: '',
    hero_alt: 'Sobre Nosotros Miregalo',
    primary_category_id: null,
    category_ids: [],
    author_id: null,
    status: 'published',
    featured: false,
    editor_pick: false,
    focus_keyword: 'sobre nosotros miregalo',
    seo_title: 'Sobre Nosotros | Miregalo',
    seo_description: 'Conoce la historia, misión y criterios de selección detrás de Miregalo, tu guía de referencia en regalos personalizados y originales.',
    canonical_url: 'https://www.miregalo.us/sobre-nosotros/',
    robots: 'index, follow',
    og_image: '/images/miregalo-logo-fullsize.png',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'page-divulgacion-de-afiliados',
    type: 'page',
    slug: 'divulgacion-de-afiliados',
    title: 'Aviso y Divulgación de Afiliados',
    excerpt: 'Compromiso de transparencia de Miregalo sobre los programas de afiliados comerciales en los que participamos.',
    intro_html: '<p>La transparencia con nuestra comunidad es nuestro pilar fundamental. En esta página te explicamos cómo se financia Miregalo y cómo funcionan los enlaces de afiliación.</p>',
    content_html: `
      <h2>¿Cómo se financia Miregalo?</h2>
      <p>Para mantener Miregalo totalmente gratuito para todos los usuarios y sostener nuestro equipo de redacción e investigación, participamos en diversos programas de marketing de afiliación.</p>

      <h2>¿Qué significa un enlace de afiliado?</h2>
      <p>Cuando visitas una de nuestras guías y haces clic en el botón de un producto recomendado que te redirige a una tienda externa (como Amazon, El Corte Inglés, Etsy o eBay) y realizas una compra, nosotros podemos recibir una pequeña comisión por parte del comercio vendedor.</p>

      <h2>¿Afecta esto al precio que pagas?</h2>
      <p><strong>En ningún caso.</strong> El precio de los productos es idéntico tanto si accedes a través de nuestros enlaces como si entras directamente a la web de la tienda. De hecho, frecuentemente destacamos promociones exclusivas, cupones y ofertas especiales de las que te beneficias directamente.</p>

      <h2>Independencia Editorial Garantizada</h2>
      <p>Nuestra selección de artículos es 100% independiente. Ninguna marca o fabricante paga por asegurarse una reseña favorable. Únicamente recomendamos aquellos productos que consideramos sinceramente excelentes para la persona y ocasión correspondiente.</p>

      <h2>Aviso Oficial de Amazon Afiliados</h2>
      <p>Miregalo participa en el Programa de Afiliados de Amazon de la Unión Europea y Amazon.com, programas de publicidad diseñados para proporcionar a sitios web un medio para obtener comisiones por publicidad mediante la creación de enlaces y anuncios hacia plataformas de Amazon.</p>
      <p><strong>Declaración oficial exigida por Amazon:</strong></p>
      <blockquote style="margin: 16px 0; padding: 14px 18px; background: #fff1f3; border-left: 4px solid #fd546c; font-style: italic;">
        «En calidad de Afiliado de Amazon, obtengo ingresos por las compras adscritas que cumplen los requisitos aplicables.» (As an Amazon Associate I earn from qualifying purchases).
      </blockquote>

      <h2>Precios y Disponibilidad</h2>
      <p>Los precios y la disponibilidad de los artículos mostrados en Miregalo corresponden al momento de redacción de cada guía y están sujetos a modificaciones por parte de las marcas y tiendas vendedoras. El precio y condiciones finales válidas para la compra serán siempre los que figuren en la web de Amazon o del comercio vendedor en el instante exacto de realizar el pedido.</p>
    `,
    faqs: [],
    hero_image: '',
    hero_alt: 'Divulgación de Afiliados Miregalo',
    primary_category_id: null,
    category_ids: [],
    author_id: null,
    status: 'published',
    featured: false,
    editor_pick: false,
    focus_keyword: 'divulgacion de afiliados miregalo',
    seo_title: 'Aviso y Divulgación de Enlaces de Afiliados | Miregalo',
    seo_description: 'Información transparente sobre los programas de afiliados en Miregalo y nuestra garantía de independencia editorial.',
    canonical_url: 'https://www.miregalo.us/divulgacion-de-afiliados/',
    robots: 'index, follow',
    og_image: '/images/miregalo-logo-fullsize.png',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

async function insertPages() {
  console.log('Inserting pages to Supabase...');
  for (const page of pages) {
    const { error } = await supabase.from('posts').upsert(page);
    if (error) console.error('Supabase error for', page.id, error.message);
    else console.log('✓ Inserted to Supabase:', page.id, page.slug);
  }

  console.log('Inserting pages to local db.json...');
  const db = JSON.parse(fs.readFileSync('data/db.json', 'utf8'));
  for (const page of pages) {
    const idx = (db.posts || []).findIndex(p => p.id === page.id || p.slug === page.slug);
    if (idx >= 0) {
      db.posts[idx] = page;
    } else {
      db.posts.push(page);
    }
  }
  fs.writeFileSync('data/db.json', JSON.stringify(db, null, 1));
  console.log('✓ Saved all pages to local db.json!');
}

insertPages();
