import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── 1. ES-EU to ES-US DICTIONARY & CONJUGATION REPLACEMENTS ──
function convertEsEuToEsUs(text) {
  if (!text) return text;

  let s = text;

  // Pronouns and determiners
  s = s.replace(/\bVosotros podéis\b/g, 'Ustedes pueden');
  s = s.replace(/\bvosotros podéis\b/g, 'ustedes pueden');
  s = s.replace(/\bVosotros tenéis\b/g, 'Ustedes tienen');
  s = s.replace(/\bvosotros tenéis\b/g, 'ustedes tienen');
  s = s.replace(/\bVosotros\b/g, 'Ustedes');
  s = s.replace(/\bvosotros\b/g, 'ustedes');
  s = s.replace(/\bVosotras\b/g, 'Ustedes');
  s = s.replace(/\bvosotras\b/g, 'ustedes');

  s = s.replace(/\bvuestro\b/g, 'su');
  s = s.replace(/\bVuestro\b/g, 'Su');
  s = s.replace(/\bvuestra\b/g, 'su');
  s = s.replace(/\bVuestra\b/g, 'Su');
  s = s.replace(/\bvuestros\b/g, 'sus');
  s = s.replace(/\bVuestros\b/g, 'Sus');
  s = s.replace(/\bvuestras\b/g, 'sus');
  s = s.replace(/\bVuestras\b/g, 'Sus');

  // Common second-person plural conjugations (Spain -> US/LatAm)
  s = s.replace(/\bpodéis\b/g, 'pueden');
  s = s.replace(/\bPodéis\b/g, 'Pueden');
  s = s.replace(/\btenéis\b/g, 'tienen');
  s = s.replace(/\bTenéis\b/g, 'Tienen');
  s = s.replace(/\bqueréis\b/g, 'quieren');
  s = s.replace(/\bQueréis\b/g, 'Quieren');
  s = s.replace(/\bsabéis\b/g, 'saben');
  s = s.replace(/\bSabéis\b/g, 'Saben');
  s = s.replace(/\bestáis\b/g, 'están');
  s = s.replace(/\bEstáis\b/g, 'Están');
  s = s.replace(/\bencontraréis\b/g, 'encontrarán');
  s = s.replace(/\bEncontraréis\b/g, 'Encontrarán');
  s = s.replace(/\belegid\b/g, 'elijan');
  s = s.replace(/\bElegid\b/g, 'Elijan');
  s = s.replace(/\bmirad\b/g, 'miren');
  s = s.replace(/\bMirad\b/g, 'Miren');
  s = s.replace(/\bdescubrid\b/g, 'descubran');
  s = s.replace(/\bDescubrid\b/g, 'Descubran');
  s = s.replace(/\bdisfrutad\b/g, 'disfruten');
  s = s.replace(/\bDisfrutad\b/g, 'Disfruten');
  s = s.replace(/\bhaced\b/g, 'hagan');
  s = s.replace(/\bHaced\b/g, 'Hagan');
  s = s.replace(/\bpensad\b/g, 'piensen');
  s = s.replace(/\bPensad\b/g, 'Piensen');
  s = s.replace(/\brecordad\b/g, 'recuerden');
  s = s.replace(/\bRecordad\b/g, 'Recuerden');
  s = s.replace(/\bcelebrad\b/g, 'celebren');
  s = s.replace(/\bCelebrad\b/g, 'Celebren');
  s = s.replace(/\bcompartid\b/g, 'compartan');
  s = s.replace(/\bCompartid\b/g, 'Compartan');

  // "os" object pronoun when used with reflexive verbs
  s = s.replace(/\bque os guste\b/gi, 'que les guste');
  s = s.replace(/\bque os ayude\b/gi, 'que les ayude');
  s = s.replace(/\bpara que os\b/gi, 'para que se');
  s = s.replace(/\bos recomendamos\b/gi, 'les recomendamos');
  s = s.replace(/\bos ayudará\b/gi, 'les ayudará');
  s = s.replace(/\bos compartimos\b/gi, 'les compartimos');
  s = s.replace(/\bos dejamos\b/gi, 'les dejamos');
  s = s.replace(/\bos presentamos\b/gi, 'les presentamos');
  s = s.replace(/\bos aseguramos\b/gi, 'les aseguramos');

  // Peninsular Spanish vocabulary -> US Hispanic Spanish
  s = s.replace(/\bordenadores\b/gi, 'computadoras');
  s = s.replace(/\bordenador portátil\b/gi, 'laptop');
  s = s.replace(/\bordenador\b/gi, 'computadora');

  s = s.replace(/\bmóviles inteligentes\b/gi, 'celulares inteligentes');
  s = s.replace(/\bteléfonos móviles\b/gi, 'teléfonos celulares');
  s = s.replace(/\bmóviles\b/gi, 'celulares');
  s = s.replace(/\bmóvil\b/gi, 'celular');

  s = s.replace(/\bcoches\b/gi, 'carros');
  s = s.replace(/\bcoche\b/gi, 'carro');

  s = s.replace(/\bgafas de sol\b/gi, 'lentes de sol');
  s = s.replace(/\bgafas\b/gi, 'lentes');

  s = s.replace(/\bpatatas fritas\b/gi, 'papas fritas');
  s = s.replace(/\bpatatas\b/gi, 'papas');

  s = s.replace(/\bzumos de fruta\b/gi, 'jugos de fruta');
  s = s.replace(/\bzumos\b/gi, 'jugos');
  s = s.replace(/\bzumo\b/gi, 'jugo');

  s = s.replace(/\baparcamiento\b/gi, 'estacionamiento');
  s = s.replace(/\bchapas y pegatinas\b/gi, 'pins y stickers');
  s = s.replace(/\bpegatinas\b/gi, 'stickers');
  s = s.replace(/\bchapas\b/gi, 'pins');

  s = s.replace(/\bvídeos\b/g, 'videos');
  s = s.replace(/\bVídeos\b/g, 'Videos');
  s = s.replace(/\bvídeo\b/g, 'video');
  s = s.replace(/\bVídeo\b/g, 'Video');

  // Currencies: Replace Euros with USD / Dollars
  s = s.replace(/(\d+)\s*(?:€|euros?)\b/gi, '$$$1 USD');
  s = s.replace(/€\s*(\d+)/g, '$$$1 USD');
  s = s.replace(/\beuros\b/gi, 'dólares');

  // Slang
  s = s.replace(/\bes muy chulo\b/gi, 'es genial');
  s = s.replace(/\bes muy guay\b/gi, 'es increíble');
  s = s.replace(/\buna pasada\b/gi, 'algo fantástico');

  // Outdated years
  s = s.replace(/\bEn 2023\b/g, 'En 2026');
  s = s.replace(/\ben 2023\b/g, 'en 2026');
  s = s.replace(/\bEn 2024\b/g, 'En 2026');
  s = s.replace(/\ben 2024\b/g, 'en 2026');

  return s;
}

// ── 2. PAGE SPECIFIC SEO BOOSTERS (KEYWORDS & INTERNAL LINKS) ──
const PAGE_BOOSTERS = {
  // 1. 14 Year Old Birthday Party (Clicks: 10, Imp: 284)
  'regalos-14-year-old-cumpleanos-party': {
    keywordH2: 'Ideas para cumpleaños 14 años varón: Temas, juegos y actividades para adolescentes',
    keywordHtml: `
<div class="seo-keyword-section" style="background:#f8fafc; border-left:4px solid #4f46e5; padding:18px 22px; margin:28px 0; border-radius:0 10px 10px 0;">
  <h2 style="color:#1e1b4b; margin:0 0 12px; font-size:1.35rem;">Ideas para cumpleaños 14 años varón: Temas, juegos y actividades</h2>
  <p>Planear una fiesta de cumpleaños para un adolescente de 14 años (varón) requiere el equilibrio perfecto entre diversión sin sentirse como una fiesta infantil. A los 14 años, los chicos buscan experiencias compartidas, competencia amistosa y momentos inolvidables con sus mejores amigos.</p>
  <ul style="line-height:1.7;">
    <li><strong>Torneo de videojuegos (Gaming Party):</strong> Organiza estaciones de consola con torneos de FIFA, Mario Kart, Fortnite o Super Smash Bros con snacks temáticos.</li>
    <li><strong>Noche de Laser Tag o Paintball:</strong> Una de las opciones más populares para chicos de 14 años en Estados Unidos, combinando adrenalina y trabajo en equipo.</li>
    <li><strong>Escape Room en casa o exterior:</strong> Resuelvan misterios en grupo antes de que el reloj marque cero.</li>
    <li><strong>Parrillada al aire libre y fogata:</strong> Hamburguesas gourmet, música con playlist de Spotify y malvaviscos asados.</li>
  </ul>
</div>
`,
    faqItem: {
      question: '¿Cuáles son las mejores ideas para cumpleaños de 14 años varón?',
      answer: 'Para chicos de 14 años, las mejores opciones son torneos de videojuegos (gaming), tardes de laser tag o paintball, noches de cine al aire libre con hamburguesas y parrillada, o salidas a parques de trampolines y pistas de go-karts.'
    },
    internalLinksHtml: `
<div class="internal-linking-hub" style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; padding:20px 24px; margin:32px 0;">
  <h3 style="color:#1e40af; margin:0 0 10px; font-size:1.15rem;">📚 Guías y regalos relacionados para adolescentes:</h3>
  <ul style="margin:0; padding-left:20px; line-height:1.8;">
    <li>¿Celebrando otras edades? Mira nuestras <a href="/blog/regalos-cumpleanos-party-ideas-13-year-olds/" style="color:#2563eb; font-weight:600; text-decoration:underline;">ideas para fiestas de 13 años</a> y la guía de <a href="/blog/regalos-12-year-old-cumpleanos-party-ideas/" style="color:#2563eb; font-weight:600; text-decoration:underline;">cumpleaños de 12 años para niños y niñas</a>.</li>
    <li>¿Buscas el obsequio ideal? Explora nuestra selección de <a href="/regalos-18th-cumpleanos-regalos-ideas/" style="color:#2563eb; font-weight:600; text-decoration:underline;">regalos para adolescentes</a> y la sección general de <a href="/categoria/cumpleanos/" style="color:#2563eb; font-weight:600; text-decoration:underline;">ideas y regalos de cumpleaños</a>.</li>
  </ul>
</div>
`
  },

  // 2. 13 Year Old Birthday Party (Clicks: 8, Imp: 207)
  'regalos-cumpleanos-party-ideas-13-year-olds': {
    keywordH2: 'Feliz cumpleaños 13 niño: Ideas y regalos para dar la bienvenida a la adolescencia',
    keywordHtml: `
<div class="seo-keyword-section" style="background:#f8fafc; border-left:4px solid #4f46e5; padding:18px 22px; margin:28px 0; border-radius:0 10px 10px 0;">
  <h2 style="color:#1e1b4b; margin:0 0 12px; font-size:1.35rem;">Feliz cumpleaños 13 niño: Actividades para la etapa teenager</h2>
  <p>Cumplir 13 años marca oficialmente la entrada al club de los <em>teenagers</em>. Para celebrar este hito con un niño de 13 años, elige temáticas que le den independencia y protagonismo junto a su grupo de amigos:</p>
  <ul style="line-height:1.7;">
    <li><strong>Fiesta temática de skate o deportes urbanos:</strong> Música, gorras personalizadas y competencia sana.</li>
    <li><strong>Día de aventura en piscina o playa:</strong> Juegos acuáticos, música y pizza para compartir.</li>
    <li><strong>Noche de cine y camping en el patio (Glamping):</strong> Proyector portátil, bolsas de dormir y películas favoritas.</li>
  </ul>
</div>
`,
    faqItem: {
      question: '¿Cómo celebrar un feliz cumpleaños 13 a un niño de forma económica?',
      answer: 'Puedes organizar una noche de videojuegos o streaming con amigos en casa, preparar una barra de pizzas caseras o tacos, y ambientar con luces LED y música moderna sin necesidad de alquilar salones costosos.'
    },
    internalLinksHtml: `
<div class="internal-linking-hub" style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; padding:20px 24px; margin:32px 0;">
  <h3 style="color:#1e40af; margin:0 0 10px; font-size:1.15rem;">📚 Artículos y guías de cumpleaños recomendadas:</h3>
  <ul style="margin:0; padding-left:20px; line-height:1.8;">
    <li>Inspírate también con las <a href="/blog/regalos-14-year-old-cumpleanos-party/" style="color:#2563eb; font-weight:600; text-decoration:underline;">60 ideas para cumpleaños de 14 años</a> o la guía de <a href="/blog/regalos-cumpleanos-deseos-for-13-year-olds/" style="color:#2563eb; font-weight:600; text-decoration:underline;">deseos y dedicatorias de 13 años</a>.</li>
    <li>Visita nuestro centro de categorías: <a href="/categoria/cumpleanos/" style="color:#2563eb; font-weight:600; text-decoration:underline;">Ideas de Cumpleaños</a> y <a href="/regalos/para-ninos/" style="color:#2563eb; font-weight:600; text-decoration:underline;">Regalos para Niños y Adolescentes</a>.</li>
  </ul>
</div>
`
  },

  // 3. Work Anniversary (Clicks: 7, Imp: 739)
  'regalos-happy-work-aniversario': {
    keywordH2: 'Frases de aniversario laboral y felicitaciones empresariales para compañeros de trabajo',
    keywordHtml: `
<div class="seo-keyword-section" style="background:#f8fafc; border-left:4px solid #4f46e5; padding:18px 22px; margin:28px 0; border-radius:0 10px 10px 0;">
  <h2 style="color:#1e1b4b; margin:0 0 12px; font-size:1.35rem;">Frases de aniversario laboral y mensajes de agradecimiento por aniversario de trabajo</h2>
  <p>El reconocimiento profesional impulsa el entusiasmo y la cultura de equipo. Ya sea que felicites a un colega, empleado o supervisor por su primer año, 5 años o 10 años en la empresa, estas dedicatorias profesionales transmiten calidez y respeto:</p>
  <blockquote style="border-left:3px solid #6366f1; padding-left:14px; font-style:italic; margin:14px 0; color:#334155;">
    «¡Feliz aniversario de trabajo! Gracias por tu dedicación constante, tu liderazgo positivo y por hacer que cada proyecto en equipo sea más exitoso. ¡Es un orgullo trabajar a tu lado!»
  </blockquote>
  <blockquote style="border-left:3px solid #6366f1; padding-left:14px; font-style:italic; margin:14px 0; color:#334155;">
    «Un aniversario laboral no es solo un año más en el calendario, sino la suma de logros, lecciones y crecimiento mutuo. ¡Feliz aniversario laboral y que vengan muchos éxitos más!»
  </blockquote>
</div>
`,
    faqItem: {
      question: '¿Qué escribir en una tarjeta de feliz aniversario de trabajo o aniversario laboral?',
      answer: 'Destaca el aprecio por su compromiso, menciona un valor personal (como su buen humor, creatividad o compañerismo) y expresa deseos de seguir colaborando en futuros proyectos exitosos.'
    },
    internalLinksHtml: `
<div class="internal-linking-hub" style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; padding:20px 24px; margin:32px 0;">
  <h3 style="color:#1e40af; margin:0 0 10px; font-size:1.15rem;">🔗 Más ideas de regalos y felicitaciones laborales:</h3>
  <ul style="margin:0; padding-left:20px; line-height:1.8;">
    <li>Descubre qué obsequiar a un compañero con nuestros <a href="/regalos-going-away-regalos-coworker/" style="color:#2563eb; font-weight:600; text-decoration:underline;">regalos de despedida para compañeros de trabajo</a>.</li>
    <li>Si se acerca el retiro de un colega, revisa <a href="/blog/regalos-what-wear-jubilacion-party/" style="color:#2563eb; font-weight:600; text-decoration:underline;">qué ponerse para una fiesta de jubilación</a> y los <a href="/regalos-thank-you-regalos-ideas/" style="color:#2563eb; font-weight:600; text-decoration:underline;">regalos de agradecimiento corporativos</a>.</li>
  </ul>
</div>
`
  },

  // 4. 12 Year Old Birthday Party (Clicks: 6, Imp: 554)
  'regalos-12-year-old-cumpleanos-party-ideas': {
    keywordH2: 'Ideas para fiesta de 12 años niña en casa y cumpleaños de 12 años varón',
    keywordHtml: `
<div class="seo-keyword-section" style="background:#f8fafc; border-left:4px solid #4f46e5; padding:18px 22px; margin:28px 0; border-radius:0 10px 10px 0;">
  <h2 style="color:#1e1b4b; margin:0 0 12px; font-size:1.35rem;">Ideas para fiesta de 12 años niña en casa y varón</h2>
  <p>A los 12 años, los niños están en la transición entre la niñez y la adolescencia temprana. Ya no quieren actividades infantiles, pero disfrutan dinámicas sociales divertidas:</p>
  <ul style="line-height:1.7;">
    <li><strong>Para niñas de 12 años en casa:</strong> Noche de spa casero con mascarillas, manicura y películas juveniles; tarde de repostería creativa decorando cupcakes; o fiesta neón (Glow in the dark party).</li>
    <li><strong>Para niños de 12 años:</strong> Tarde de bowling, circuito de karts, o torneo de fútbol rápido y parrillada en el parque.</li>
  </ul>
</div>
`,
    faqItem: {
      question: '¿Qué se puede hacer en un cumpleaños de 12 años para niñas en casa?',
      answer: 'Las pijamadas temáticas, noches de karaoke, talleres de manualidades de pulseras de la amistad, sesiones de spa casero y noches de cine con palomitas gourmet son las favoritas de las niñas de 12 años.'
    },
    internalLinksHtml: `
<div class="internal-linking-hub" style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; padding:20px 24px; margin:32px 0;">
  <h3 style="color:#1e40af; margin:0 0 10px; font-size:1.15rem;">🔗 Explora más ideas de fiestas por edades:</h3>
  <ul style="margin:0; padding-left:20px; line-height:1.8;">
    <li>Revisa las <a href="/blog/regalos-cumpleanos-party-ideas-13-year-olds/" style="color:#2563eb; font-weight:600; text-decoration:underline;">ideas para fiestas de 13 años</a> y los planes para <a href="/blog/regalos-14-year-old-cumpleanos-party/" style="color:#2563eb; font-weight:600; text-decoration:underline;">cumpleaños de 14 años para adolescentes</a>.</li>
    <li>Visita la sección de <a href="/categoria/cumpleanos/" style="color:#2563eb; font-weight:600; text-decoration:underline;">Cumpleaños en MiRegalo</a>.</li>
  </ul>
</div>
`
  },

  // 5. 10 Year Anniversary (Clicks: 4, Imp: 370)
  'regalos-happy-10-anos-aniversario': {
    keywordH2: 'Feliz aniversario 10 años juntos: Dedicatorias románticas de bodas de estaño y aluminio',
    keywordHtml: `
<div class="seo-keyword-section" style="background:#f8fafc; border-left:4px solid #4f46e5; padding:18px 22px; margin:28px 0; border-radius:0 10px 10px 0;">
  <h2 style="color:#1e1b4b; margin:0 0 12px; font-size:1.35rem;">Feliz aniversario 10 años juntos: Una década de amor incondicional</h2>
  <p>Cumplir 10 años de casados o de noviazgo es conocido tradicionalmente como las <strong>Bodas de Estaño o Aluminio</strong>, simbolizando flexibilidad, durabilidad y una unión que no se oxida ante los desafíos del tiempo.</p>
  <blockquote style="border-left:3px solid #ec4899; padding-left:14px; font-style:italic; margin:14px 0; color:#334155;">
    «¡Feliz décimo aniversario, amor de mi vida! Diez años juntos, miles de risas y un amor que sigue creciendo día con día. Gracias por ser mi mayor refugio y mi mejor aventura.»
  </blockquote>
</div>
`,
    faqItem: {
      question: '¿Qué se celebra a los 10 años de casados y qué regalo tradicional se da?',
      answer: 'A los 10 años de matrimonio se celebran las Bodas de Aluminio o Estaño. Los regalos tradicionales incluyen joyas grabadas en metales duraderos, marcos conmemorativos, escapadas de fin de semana o relojes finos.'
    },
    internalLinksHtml: `
<div class="internal-linking-hub" style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; padding:20px 24px; margin:32px 0;">
  <h3 style="color:#1e40af; margin:0 0 10px; font-size:1.15rem;">💍 Celebra aniversarios con estilo:</h3>
  <ul style="margin:0; padding-left:20px; line-height:1.8;">
    <li>Consulta las <a href="/blog/regalos-happy-30th-aniversario-frases/" style="color:#2563eb; font-weight:600; text-decoration:underline;">frases para 30 años de aniversario</a> y las dedicatorias de <a href="/blog/regalos-happy-8th-aniversario-frases/" style="color:#2563eb; font-weight:600; text-decoration:underline;">8 años de casados</a>.</li>
    <li>Encuentra <a href="/blog/regalos-things-to-do-for-aniversario/" style="color:#2563eb; font-weight:600; text-decoration:underline;">más de 45 cosas románticas para hacer en tu aniversario</a> y visita el catálogo de <a href="/categoria/aniversario/" style="color:#2563eb; font-weight:600; text-decoration:underline;">regalos de aniversario</a>.</li>
  </ul>
</div>
`
  },

  // 6. Spiritual People Gifts (Clicks: 4, Imp: 113)
  'regalos-para-spiritual-people': {
    keywordH2: 'Regalos espirituales para mujeres y personas que buscan paz interior',
    keywordHtml: `
<div class="seo-keyword-section" style="background:#f8fafc; border-left:4px solid #4f46e5; padding:18px 22px; margin:28px 0; border-radius:0 10px 10px 0;">
  <h2 style="color:#1e1b4b; margin:0 0 12px; font-size:1.35rem;">Regalos espirituales para mujeres: Cristales, armonía y bienestar</h2>
  <p>Cuando buscas obsequios con significado para mujeres espirituales, opta por elementos que promuevan la calma, la meditación y la conexión con la naturaleza: cuarzos energéticos (amatista, cuarzo rosa), cuencos tibetanos, difusores de aromaterapia con aceites esenciales puros, y diarios de gratitud guiados.</p>
</div>
`,
    faqItem: {
      question: '¿Qué regalar a una persona o mujer con inclinaciones espirituales?',
      answer: 'Los mejores regalos son sets de cristales naturales curativos, velas artesanales con aceites esenciales, cuencos tibetanos para meditación, tapetes de yoga de corcho ecológico y libros de crecimiento personal.'
    },
    internalLinksHtml: `
<div class="internal-linking-hub" style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; padding:20px 24px; margin:32px 0;">
  <h3 style="color:#1e40af; margin:0 0 10px; font-size:1.15rem;">🧘‍♀️ Más guías de bienestar y obsequios personales:</h3>
  <ul style="margin:0; padding-left:20px; line-height:1.8;">
    <li>Explora nuestra guía de <a href="/regalos/para-mujeres/" style="color:#2563eb; font-weight:600; text-decoration:underline;">regalos especiales para mujeres</a> y <a href="/regalos-para-women-in-their-30s/" style="color:#2563eb; font-weight:600; text-decoration:underline;">obsequios para mujeres en sus 30s</a>.</li>
    <li>Descubre opciones para <a href="/regalos-mental-health/" style="color:#2563eb; font-weight:600; text-decoration:underline;">salud mental y autocuidado</a> en nuestro portal.</li>
  </ul>
</div>
`
  },

  // 7. Travel Gifts for Men (Clicks: 3, Imp: 27)
  'regalos-travel-regalos-men': {
    keywordH2: 'Regalos para viajeros hombres: Gadgets y accesorios indispensables para el equipaje',
    keywordHtml: `
<div class="seo-keyword-section" style="background:#f8fafc; border-left:4px solid #4f46e5; padding:18px 22px; margin:28px 0; border-radius:0 10px 10px 0;">
  <h2 style="color:#1e1b4b; margin:0 0 12px; font-size:1.35rem;">Regalos para viajeros hombres: Prácticos, resistentes y compactos</h2>
  <p>Los hombres que viajan con frecuencia valoran la funcionalidad por encima de todo. Desde mochilas de mano compatibles con aerolíneas en Estados Unidos hasta organizadores de cables, audífonos con cancelación de ruido y básculas digitales para maletas, estos obsequios hacen que cada vuelo o trayecto por carretera sea mucho más cómodo.</p>
</div>
`,
    faqItem: {
      question: '¿Qué regalar a un hombre al que le gusta viajar?',
      answer: 'Un cargador portátil de alta capacidad (power bank), almohada de viaje viscoelástica ergonómica, organizadores de compresión para maletas (packing cubes) y adaptadores universales para enchufes internacionales son aciertos seguros.'
    },
    internalLinksHtml: `
<div class="internal-linking-hub" style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; padding:20px 24px; margin:32px 0;">
  <h3 style="color:#1e40af; margin:0 0 10px; font-size:1.15rem;">✈️ Guías relacionadas para hombres y viajes:</h3>
  <ul style="margin:0; padding-left:20px; line-height:1.8;">
    <li>Mira nuestra selección de <a href="/regalos/para-hombres/" style="color:#2563eb; font-weight:600; text-decoration:underline;">regalos para hombres</a> y la colección de <a href="/regalos-car-regalos-men/" style="color:#2563eb; font-weight:600; text-decoration:underline;">accesorios de auto para hombres</a>.</li>
    <li>Explora opciones de aventura en la sección <a href="/regalos-entertaining-outdoors/" style="color:#2563eb; font-weight:600; text-decoration:underline;">vida al aire libre</a>.</li>
  </ul>
</div>
`
  },

  // 8. What to wear to a retirement party (Clicks: 3, Imp: 44)
  'regalos-what-wear-jubilacion-party': {
    keywordH2: 'Cómo vestir para una fiesta de jubilación: Outfits elegantes y códigos de vestimenta',
    keywordHtml: `
<div class="seo-keyword-section" style="background:#f8fafc; border-left:4px solid #4f46e5; padding:18px 22px; margin:28px 0; border-radius:0 10px 10px 0;">
  <h2 style="color:#1e1b4b; margin:0 0 12px; font-size:1.35rem;">Cómo vestir para una jubilación: Consejos según el tipo de fiesta</h2>
  <p>Al elegir tu atuendo para una celebración de retiro o jubilación en Estados Unidos o Latinoamérica, el lugar y la hora marcan la pauta:</p>
  <ul style="line-height:1.7;">
    <li><strong>Almuerzo o cóctel formal:</strong> Traje sastre o vestido midi en tonos neutros o pasteles; zapatos de vestir pulcros.</li>
    <li><strong>Reunión casual en jardín o restaurante:</strong> Estilo <em>smart casual</em> con blazer ligero, camisa de botones sin corbata, o enterizo estilizado con accesorios elegantes.</li>
  </ul>
</div>
`,
    faqItem: {
      question: '¿Qué ropa ponerse para una fiesta de jubilación o retiro laboral?',
      answer: 'Opta por un estilo smart casual o semi-formal: pantalones de vestir con camisa o blusa elegante, blazer y zapatos cómodos. Evita prendas demasiado informales como sandalias de playa o camisetas deportivas salvo que sea una parrillada al aire libre.'
    },
    internalLinksHtml: `
<div class="internal-linking-hub" style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; padding:20px 24px; margin:32px 0;">
  <h3 style="color:#1e40af; margin:0 0 10px; font-size:1.15rem;">🎉 Guías relacionadas de celebraciones y agradecimiento:</h3>
  <ul style="margin:0; padding-left:20px; line-height:1.8;">
    <li>Inspírate con las <a href="/blog/regalos-happy-work-aniversario/" style="color:#2563eb; font-weight:600; text-decoration:underline;">frases de aniversario laboral y despedida</a>.</li>
    <li>Revisa nuestras sugerencias de <a href="/regalos-thank-you-regalos-ideas/" style="color:#2563eb; font-weight:600; text-decoration:underline;">regalos de agradecimiento</a> para homenajear a quien se jubila.</li>
  </ul>
</div>
`
  },

  // 9. Halloween Symbols Explained (Clicks: 1, Imp: 327)
  'regalos-halloween-symbols-explained': {
    keywordH2: 'Símbolos de Halloween y su significado tradicional: Calabazas, murciélagos y leyendas',
    keywordHtml: `
<div class="seo-keyword-section" style="background:#f8fafc; border-left:4px solid #4f46e5; padding:18px 22px; margin:28px 0; border-radius:0 10px 10px 0;">
  <h2 style="color:#1e1b4b; margin:0 0 12px; font-size:1.35rem;">Símbolos de Halloween y su significado: Cosas que representan la noche de brujas</h2>
  <p>Halloween es una de las fiestas más populares en Estados Unidos, con raíces en la antigua festividad celta de Samhain. Cada símbolo icónico encierra una historia fascinante:</p>
  <ul style="line-height:1.7;">
    <li><strong>Calabaza tallada (Jack-o'-lantern):</strong> Originaria de una leyenda irlandesa sobre Stingy Jack; servía para espantar a los malos espíritus.</li>
    <li><strong>Gatos negros:</strong> En la mitología medieval eran asociados con brujas protectoras y transmutación energética.</li>
    <li><strong>Murciélagos y telas de araña:</strong> Representan la transición de estaciones y la cercanía al mundo sobrenatural.</li>
  </ul>
</div>
`,
    faqItem: {
      question: '¿Cuáles son los principales símbolos de Halloween y qué representan?',
      answer: 'Los símbolos más importantes son las calabazas iluminadas (protección contra espíritus), los gatos negros (misterio y magia), las brujas con escobas (conexión con lo oculto) y los fantasmas o calaveras (recordatorio del ciclo de la vida y el más allá).'
    },
    internalLinksHtml: `
<div class="internal-linking-hub" style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; padding:20px 24px; margin:32px 0;">
  <h3 style="color:#1e40af; margin:0 0 10px; font-size:1.15rem;">🎃 Todo para tu fiesta de Halloween:</h3>
  <ul style="margin:0; padding-left:20px; line-height:1.8;">
    <li>¿Organizando una fiesta? Descubre <a href="/blog/regalos-halloween-party-names/" style="color:#2563eb; font-weight:600; text-decoration:underline;">+120 nombres creativos para fiestas de Halloween</a>.</li>
    <li>Sorprende a tu pareja con <a href="/regalos-halloween-regalos-novia/" style="color:#2563eb; font-weight:600; text-decoration:underline;">regalos de Halloween para novia</a> o explora ideas en <a href="/categoria/halloween/" style="color:#2563eb; font-weight:600; text-decoration:underline;">artículos y regalos de Halloween</a>.</li>
  </ul>
</div>
`
  },

  // 10. Halloween Drawing Ideas (Clicks: 1, Imp: 617)
  'regalos-halloween-drawing-ideas': {
    keywordH2: 'Ideas de dibujos para Halloween: Dibujos fáciles y paso a paso para niños y adolescentes',
    keywordHtml: `
<div class="seo-keyword-section" style="background:#f8fafc; border-left:4px solid #4f46e5; padding:18px 22px; margin:28px 0; border-radius:0 10px 10px 0;">
  <h2 style="color:#1e1b4b; margin:0 0 12px; font-size:1.35rem;">Ideas de dibujos para Halloween: Diseños fáciles y divertidos</h2>
  <p>Crear dibujos de Halloween es una actividad excelente para colegios, manualidades en casa o para decorar tarjetas y vitrinas festivas:</p>
  <ul style="line-height:1.7;">
    <li><strong>Fantasmas kawaii con sombrero de bruja:</strong> Trazos simples y redondeados ideales para niños de primaria.</li>
    <li><strong>Calabazas sonrientes y calaveritas decoradas:</strong> Inspiradas tanto en la tradición de Halloween como en el Día de Muertos.</li>
    <li><strong>Casas embrujadas con siluetas de murciélagos:</strong> Un clásico que luce increíble usando cartulina negra y tizas de colores.</li>
  </ul>
</div>
`,
    faqItem: {
      question: '¿Qué dibujos fáciles de Halloween se pueden hacer con niños?',
      answer: 'Fantasmitas flotantes, murciélagos de alas sencillas, arañas colgadas de un hilo y calabazas con ojos triangulares son las figuras más sencillas y rápidas de dibujar.'
    },
    internalLinksHtml: `
<div class="internal-linking-hub" style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:12px; padding:20px 24px; margin:32px 0;">
  <h3 style="color:#1e40af; margin:0 0 10px; font-size:1.15rem;">🎨 Más actividades e ideas para la temporada:</h3>
  <ul style="margin:0; padding-left:20px; line-height:1.8;">
    <li>Conoce la historia detrás de cada figura en <a href="/blog/regalos-halloween-symbols-explained/" style="color:#2563eb; font-weight:600; text-decoration:underline;">símbolos de Halloween y su significado</a>.</li>
    <li>Encuentra disfraces y detalles únicos en <a href="/categoria/halloween/" style="color:#2563eb; font-weight:600; text-decoration:underline;">nuestra sección especial de Halloween</a>.</li>
  </ul>
</div>
`
  }
};

async function optimizeAllClickPages() {
  console.log('=== OPTIMIZING TOP CLICK PAGES FOR GSC, INTERNAL LINKS & ES-US ===');

  const auditData = JSON.parse(fs.readFileSync('scripts/top-pages-audit.json', 'utf8')).filter(p => !p.not_found_in_db);
  console.log(`Processing ${auditData.length} pages in Supabase...`);

  let updatedCount = 0;

  for (const item of auditData) {
    const slug = item.db_slug;
    const { data: posts, error } = await sb
      .from('posts')
      .select('id, slug, title, intro_html, content_html, faqs, seo_title, seo_description')
      .eq('id', item.post_id)
      .limit(1);

    const post = posts?.[0];
    if (!post) continue;

    let title = post.title || '';
    let intro = post.intro_html || '';
    let content = post.content_html || '';
    let faqs = Array.isArray(post.faqs) ? [...post.faqs] : [];
    let seoTitle = post.seo_title || '';
    let seoDesc = post.seo_description || '';

    let changed = false;

    // 1. Language conversion: Peninsular ES-EU -> US Hispanic ES-US
    const newTitle = convertEsEuToEsUs(title);
    if (newTitle !== title) {
      title = newTitle;
      changed = true;
    }

    const newIntro = convertEsEuToEsUs(intro);
    if (newIntro !== intro) {
      intro = newIntro;
      changed = true;
    }

    let newContent = convertEsEuToEsUs(content);
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }

    // Convert FAQs
    const newFaqs = faqs.map(f => ({
      question: convertEsEuToEsUs(f.question || ''),
      answer: convertEsEuToEsUs(f.answer || ''),
    }));
    if (JSON.stringify(newFaqs) !== JSON.stringify(faqs)) {
      faqs = newFaqs;
      changed = true;
    }

    // 2. Specific Page Booster (Keywords & Internal Links)
    const booster = PAGE_BOOSTERS[slug];
    if (booster) {
      // Check if keyword section already present
      if (!content.includes('class="seo-keyword-section"')) {
        content = booster.keywordHtml + '\n' + content;
        changed = true;
      }

      // Check if internal links already present
      if (!content.includes('class="internal-linking-hub"')) {
        content = content + '\n' + booster.internalLinksHtml;
        changed = true;
      }

      // Check if FAQ item already present
      if (booster.faqItem && !faqs.some(f => f.question === booster.faqItem.question)) {
        faqs.push(booster.faqItem);
        changed = true;
      }
    } else {
      // General automatic internal linking mesh if content doesn't have internal links
      if (!content.includes('class="internal-linking-hub"') && item.internal_links_count === 0) {
        // Build contextual related links based on slug keywords
        let relatedLinks = [];
        if (slug.includes('cumpleanos') || slug.includes('party')) {
          relatedLinks = [
            '<li>Descubre más inspiración en nuestras <a href="/blog/regalos-14-year-old-cumpleanos-party/" style="color:#2563eb; font-weight:600; text-decoration:underline;">ideas para fiestas de 14 años</a> y <a href="/blog/regalos-cumpleanos-party-ideas-13-year-olds/" style="color:#2563eb; font-weight:600; text-decoration:underline;">cumpleaños de 13 años</a>.</li>',
            '<li>Explora nuestro catálogo completo de <a href="/categoria/cumpleanos/" style="color:#2563eb; font-weight:600; text-decoration:underline;">ideas y regalos de cumpleaños</a>.</li>'
          ];
        } else if (slug.includes('aniversario') || slug.includes('boda')) {
          relatedLinks = [
            '<li>Lee también nuestras <a href="/blog/regalos-happy-work-aniversario/" style="color:#2563eb; font-weight:600; text-decoration:underline;">frases de aniversario laboral</a> o las dedicatorias de <a href="/blog/regalos-happy-10-anos-aniversario/" style="color:#2563eb; font-weight:600; text-decoration:underline;">10 años de feliz aniversario</a>.</li>',
            '<li>Revisa planes únicos en <a href="/blog/regalos-things-to-do-for-aniversario/" style="color:#2563eb; font-weight:600; text-decoration:underline;">cosas que hacer en tu aniversario</a> y explora la categoría de <a href="/categoria/aniversario/" style="color:#2563eb; font-weight:600; text-decoration:underline;">regalos de aniversario</a>.</li>'
          ];
        } else if (slug.includes('halloween')) {
          relatedLinks = [
            '<li>Inspírate con los <a href="/blog/regalos-halloween-symbols-explained/" style="color:#2563eb; font-weight:600; text-decoration:underline;">símbolos de Halloween y su significado</a> o las <a href="/blog/regalos-halloween-drawing-ideas/" style="color:#2563eb; font-weight:600; text-decoration:underline;">ideas de dibujos de Halloween</a>.</li>',
            '<li>Encuentra detalles para celebrar en la colección de <a href="/categoria/halloween/" style="color:#2563eb; font-weight:600; text-decoration:underline;">regalos de Halloween</a>.</li>'
          ];
        } else {
          relatedLinks = [
            '<li>Encuentra ideas para cada ocasión en <a href="/regalos/para-hombres/" style="color:#2563eb; font-weight:600; text-decoration:underline;">regalos para hombres</a> y <a href="/regalos/para-mujeres/" style="color:#2563eb; font-weight:600; text-decoration:underline;">regalos para mujeres</a>.</li>',
            '<li>Visita nuestra página principal de <a href="/" style="color:#2563eb; font-weight:600; text-decoration:underline;">guías de regalos MiRegalo</a>.</li>'
          ];
        }

        const generalHubHtml = `
<div class="internal-linking-hub" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:18px 22px; margin:28px 0;">
  <h4 style="color:#1e293b; margin:0 0 10px; font-size:1.05rem;">🔗 También te puede interesar:</h4>
  <ul style="margin:0; padding-left:20px; line-height:1.8;">
    ${relatedLinks.join('\n    ')}
  </ul>
</div>
`;
        content = content + '\n' + generalHubHtml;
        changed = true;
      }
    }

    if (changed) {
      const { error: updateErr } = await sb
        .from('posts')
        .update({
          title,
          intro_html: intro,
          content_html: content,
          faqs,
          updated_at: new Date().toISOString(),
        })
        .eq('id', post.id);

      if (updateErr) {
        console.error(`Error updating post ${slug}:`, updateErr.message);
      } else {
        updatedCount++;
        console.log(`[Optimized] ${slug} -> Language modernized & internal links added.`);
      }
    }
  }

  console.log(`\n=== COMPLETED: Successfully optimized ${updatedCount} posts in Supabase! ===`);
}

optimizeAllClickPages().catch(console.error);
