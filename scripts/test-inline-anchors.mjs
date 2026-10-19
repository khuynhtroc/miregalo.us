import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

// Flexible and comprehensive anchor rules
const ANCHOR_RULES = [
  // Age-specific parties
  {
    regex: /\b(14 años)\b/i,
    url: '/blog/regalos-14-year-old-cumpleanos-party/',
    anchorText: 'ideas para fiestas de 14 años',
    excludeSlug: 'regalos-14-year-old-cumpleanos-party',
  },
  {
    regex: /\b(13 años)\b/i,
    url: '/blog/regalos-cumpleanos-party-ideas-13-year-olds/',
    anchorText: 'fiestas de cumpleaños de 13 años',
    excludeSlug: 'regalos-cumpleanos-party-ideas-13-year-olds',
  },
  {
    regex: /\b(12 años)\b/i,
    url: '/blog/regalos-12-year-old-cumpleanos-party-ideas/',
    anchorText: 'cumpleaños de 12 años',
    excludeSlug: 'regalos-12-year-old-cumpleanos-party-ideas',
  },
  {
    regex: /\b(5 años)\b/i,
    url: '/blog/regalos-5-year-old-cumpleanos-party-ideas/',
    anchorText: 'cumpleaños de 5 años',
    excludeSlug: 'regalos-5-year-old-cumpleanos-party-ideas',
  },
  {
    regex: /\b(6 años)\b/i,
    url: '/blog/regalos-6-year-old-cumpleanos-party-ideas/',
    anchorText: 'cumpleaños de 6 años',
    excludeSlug: 'regalos-6-year-old-cumpleanos-party-ideas',
  },
  {
    regex: /\b(fiestas? de cumpleaños|celebrar (?:su|un|el) cumpleaños|ideas de cumpleaños)\b/i,
    url: '/categoria/cumpleanos/',
    anchorText: null, // use matched text
    excludeSlug: null,
  },
  {
    regex: /\b(regalos para adolescentes|obsequios para adolescentes|adolescentes)\b/i,
    url: '/regalos-18th-cumpleanos-regalos-ideas/',
    anchorText: null,
    excludeSlug: 'regalos-18th-cumpleanos-regalos-ideas',
  },

  // Anniversaries
  {
    regex: /\b(aniversario laboral|aniversarios? de trabajo|aniversario en la empresa)\b/i,
    url: '/blog/regalos-happy-work-aniversario/',
    anchorText: null,
    excludeSlug: 'regalos-happy-work-aniversario',
  },
  {
    regex: /\b(10 años de casados|décimo aniversario|10\.º aniversario|diez años juntos)\b/i,
    url: '/blog/regalos-happy-10-anos-aniversario/',
    anchorText: null,
    excludeSlug: 'regalos-happy-10-anos-aniversario',
  },
  {
    regex: /\b(30 años de casados|30\.º aniversario|treinta años juntos|bodas de perla)\b/i,
    url: '/blog/regalos-happy-30th-aniversario-frases/',
    anchorText: null,
    excludeSlug: 'regalos-happy-30th-aniversario-frases',
  },
  {
    regex: /\b(8 años de casados|8\.º aniversario|ocho años juntos)\b/i,
    url: '/blog/regalos-happy-8th-aniversario-frases/',
    anchorText: null,
    excludeSlug: 'regalos-happy-8th-aniversario-frases',
  },
  {
    regex: /\b(aniversario para mi esposa|dedicatorias para (?:mi|su) esposa|frases para tu esposa)\b/i,
    url: '/blog/regalos-aniversario-frases-para-esposa/',
    anchorText: null,
    excludeSlug: 'regalos-aniversario-frases-para-esposa',
  },
  {
    regex: /\b(celebrar (?:un|el) aniversario|actividades en pareja|celebrar su amor)\b/i,
    url: '/blog/regalos-things-to-do-for-aniversario/',
    anchorText: null,
    excludeSlug: 'regalos-things-to-do-for-aniversario',
  },
  {
    regex: /\b(regalos de aniversario|aniversario de bodas|aniversario de matrimonio)\b/i,
    url: '/categoria/aniversario/',
    anchorText: null,
    excludeSlug: null,
  },

  // Work & Retirement
  {
    regex: /\b(fiesta de jubilación|código de vestimenta|celebrar la jubilación)\b/i,
    url: '/blog/regalos-what-wear-jubilacion-party/',
    anchorText: null,
    excludeSlug: 'regalos-what-wear-jubilacion-party',
  },
  {
    regex: /\b(compañeros de trabajo|colegas de trabajo|despedida de un colega)\b/i,
    url: '/regalos-going-away-regalos-coworker/',
    anchorText: null,
    excludeSlug: 'regalos-going-away-regalos-coworker',
  },
  {
    regex: /\b(regalos de agradecimiento|mostrar agradecimiento|agradecimiento sincero)\b/i,
    url: '/regalos-thank-you-regalos-ideas/',
    anchorText: null,
    excludeSlug: 'regalos-thank-you-regalos-ideas',
  },

  // Halloween
  {
    regex: /\b(nombres para fiestas? de Halloween|temas de Halloween)\b/i,
    url: '/blog/regalos-halloween-party-names/',
    anchorText: null,
    excludeSlug: 'regalos-halloween-party-names',
  },
  {
    regex: /\b(símbolos de Halloween|tradiciones de Halloween)\b/i,
    url: '/blog/regalos-halloween-symbols-explained/',
    anchorText: null,
    excludeSlug: 'regalos-halloween-symbols-explained',
  },
  {
    regex: /\b(dibujos de Halloween|dibujar en Halloween|manualidades de Halloween)\b/i,
    url: '/blog/regalos-halloween-drawing-ideas/',
    anchorText: null,
    excludeSlug: 'regalos-halloween-drawing-ideas',
  },
  {
    regex: /\b(fiesta de Halloween|noche de brujas|celebración de Halloween)\b/i,
    url: '/categoria/halloween/',
    anchorText: null,
    excludeSlug: null,
  },

  // Niches
  {
    regex: /\b(personas espirituales|regalos espirituales|paz interior|espiritualidad)\b/i,
    url: '/regalos-para-spiritual-people/',
    anchorText: null,
    excludeSlug: 'regalos-para-spiritual-people',
  },
  {
    regex: /\b(hombres que aman viajar|viajeros hombres|regalos para viajeros|viajes internacionales)\b/i,
    url: '/regalos-travel-regalos-men/',
    anchorText: null,
    excludeSlug: 'regalos-travel-regalos-men',
  },
  {
    regex: /\b(regalos para hombres|obsequios para hombres|hombres especiales)\b/i,
    url: '/regalos/para-hombres/',
    anchorText: null,
    excludeSlug: null,
  },
  {
    regex: /\b(regalos para mujeres|obsequios para mujeres|mujeres especiales)\b/i,
    url: '/regalos/para-mujeres/',
    anchorText: null,
    excludeSlug: null,
  },
  {
    regex: /\b(regalos para niños|juguetes para niños|obsequios para niños)\b/i,
    url: '/regalos/para-ninos/',
    anchorText: null,
    excludeSlug: null,
  },
  {
    regex: /\b(videojuegos|amantes de los videojuegos|consolas)\b/i,
    url: '/regalos-pc-gamers/',
    anchorText: null,
    excludeSlug: 'regalos-pc-gamers',
  },
  {
    regex: /\b(juegos de mesa|juegos de mesa divertidos)\b/i,
    url: '/regalos-board-game-lovers/',
    anchorText: null,
    excludeSlug: 'regalos-board-game-lovers',
  },
  {
    regex: /\b(salud mental|autocuidado|bienestar emocional)\b/i,
    url: '/regalos-mental-health/',
    anchorText: null,
    excludeSlug: 'regalos-mental-health',
  },
  {
    regex: /\b(madres solteras|madre soltera)\b/i,
    url: '/blog/regalos-single-mama-frases/',
    anchorText: null,
    excludeSlug: 'regalos-single-mama-frases',
  },
];

function insertInlineAnchors(html, currentSlug) {
  if (!html) return { html, insertedCount: 0 };

  const usedUrls = new Set();
  const existingMatches = html.match(/href=["']([^"']+)["']/g) || [];
  for (const m of existingMatches) {
    const u = m.replace(/^href=["']|["']$/g, '');
    usedUrls.add(u);
  }

  let insertedCount = 0;

  // Process paragraph by paragraph
  const newHtml = html.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (pTag, pContent) => {
    if (insertedCount >= 5) return pTag;
    if (/<a\b/i.test(pContent)) return pTag;

    let modified = pContent;

    for (const rule of ANCHOR_RULES) {
      if (insertedCount >= 5) break;
      if (rule.excludeSlug && (rule.excludeSlug === currentSlug || currentSlug.includes(rule.excludeSlug))) {
        continue;
      }
      if (usedUrls.has(rule.url)) {
        continue;
      }

      const match = rule.regex.exec(modified);
      if (match) {
        const originalText = match[0];
        // If anchorText is provided, replace with anchorText or keep original
        const textToDisplay = originalText;
        const linkTag = `<a href="${rule.url}" style="color:#2563eb; font-weight:600; text-decoration:underline;">${textToDisplay}</a>`;
        
        modified = modified.replace(originalText, linkTag);
        usedUrls.add(rule.url);
        insertedCount++;
        break;
      }
    }

    return pTag.replace(pContent, modified);
  });

  return { html: newHtml, insertedCount };
}

async function dryRunAll() {
  const auditPages = JSON.parse(fs.readFileSync('scripts/top-pages-audit.json', 'utf8')).filter(p => !p.not_found_in_db);
  console.log(`Testing inline anchors for all ${auditPages.length} click pages...`);

  let modifiedPages = 0;
  let totalAnchors = 0;

  for (const item of auditPages) {
    const { data: posts } = await sb
      .from('posts')
      .select('id, slug, title, content_html')
      .eq('id', item.post_id)
      .limit(1);

    const post = posts?.[0];
    if (!post?.content_html) continue;

    const { html, insertedCount } = insertInlineAnchors(post.content_html, post.slug);
    if (insertedCount > 0) {
      modifiedPages++;
      totalAnchors += insertedCount;
    }
  }

  console.log(`\nRESULT: ${modifiedPages} / ${auditPages.length} pages will receive a total of ${totalAnchors} natural in-body anchor links!`);
}

dryRunAll().catch(console.error);
