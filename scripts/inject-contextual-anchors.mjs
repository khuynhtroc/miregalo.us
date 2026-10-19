import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const ANCHOR_RULES = [
  // ── High-Authority Category Hubs ──
  {
    pattern: /\b(fiestas? de cumpleaños|celebrar (?:un|el|su) cumpleaños|cumpleaños especial)\b/i,
    url: '/categoria/cumpleanos/',
    anchorText: 'ideas de cumpleaños',
    excludeSlug: null,
  },
  {
    pattern: /\b(celebrar (?:un|el|su) aniversario|aniversario de bodas|aniversario de matrimonio)\b/i,
    url: '/categoria/aniversario/',
    anchorText: 'regalos de aniversario',
    excludeSlug: null,
  },
  {
    pattern: /\b(fiesta de Halloween|noche de brujas|celebrar Halloween)\b/i,
    url: '/categoria/halloween/',
    anchorText: 'celebración de Halloween',
    excludeSlug: null,
  },
  {
    pattern: /\b(regalos para hombres|obsequios para hombres|hombres especiales)\b/i,
    url: '/regalos/para-hombres/',
    anchorText: 'regalos para hombres',
    excludeSlug: 'regalos-para-hombres',
  },
  {
    pattern: /\b(regalos para mujeres|obsequios para mujeres|mujeres especiales)\b/i,
    url: '/regalos/para-mujeres/',
    anchorText: 'regalos para mujeres',
    excludeSlug: 'regalos-para-mujeres',
  },
  {
    pattern: /\b(regalos para niños|juguetes para niños|obsequios para niños)\b/i,
    url: '/regalos/para-ninos/',
    anchorText: 'regalos para niños',
    excludeSlug: 'regalos-para-ninos',
  },

  // ── Cluster Deep-Links ──
  {
    pattern: /\b(14 años)\b/i,
    url: '/blog/regalos-14-year-old-cumpleanos-party/',
    anchorText: 'ideas para fiestas de 14 años',
    excludeSlug: 'regalos-14-year-old-cumpleanos-party',
  },
  {
    pattern: /\b(13 años)\b/i,
    url: '/blog/regalos-cumpleanos-party-ideas-13-year-olds/',
    anchorText: 'fiestas de cumpleaños de 13 años',
    excludeSlug: 'regalos-cumpleanos-party-ideas-13-year-olds',
  },
  {
    pattern: /\b(12 años)\b/i,
    url: '/blog/regalos-12-year-old-cumpleanos-party-ideas/',
    anchorText: 'cumpleaños de 12 años',
    excludeSlug: 'regalos-12-year-old-cumpleanos-party-ideas',
  },
  {
    pattern: /\b(5 años)\b/i,
    url: '/blog/regalos-5-year-old-cumpleanos-party-ideas/',
    anchorText: 'cumpleaños de 5 años',
    excludeSlug: 'regalos-5-year-old-cumpleanos-party-ideas',
  },
  {
    pattern: /\b(6 años)\b/i,
    url: '/blog/regalos-6-year-old-cumpleanos-party-ideas/',
    anchorText: 'cumpleaños de 6 años',
    excludeSlug: 'regalos-6-year-old-cumpleanos-party-ideas',
  },
  {
    pattern: /\b(adolescentes|chicos adolescentes)\b/i,
    url: '/regalos-18th-cumpleanos-regalos-ideas/',
    anchorText: 'regalos para adolescentes',
    excludeSlug: 'regalos-18th-cumpleanos-regalos-ideas',
  },
  {
    pattern: /\b(aniversario de trabajo|aniversario laboral|aniversarios laborales)\b/i,
    url: '/blog/regalos-happy-work-aniversario/',
    anchorText: 'aniversario laboral',
    excludeSlug: 'regalos-happy-work-aniversario',
  },
  {
    pattern: /\b(10 años de casados|décimo aniversario|10\.º aniversario|diez años juntos)\b/i,
    url: '/blog/regalos-happy-10-anos-aniversario/',
    anchorText: 'feliz aniversario de 10 años',
    excludeSlug: 'regalos-happy-10-anos-aniversario',
  },
  {
    pattern: /\b(30 años de casados|30\.º aniversario|treinta años juntos|bodas de perla)\b/i,
    url: '/blog/regalos-happy-30th-aniversario-frases/',
    anchorText: '30 aniversario de casados',
    excludeSlug: 'regalos-happy-30th-aniversario-frases',
  },
  {
    pattern: /\b(8 años de casados|8\.º aniversario|ocho años juntos)\b/i,
    url: '/blog/regalos-happy-8th-aniversario-frases/',
    anchorText: '8 años de casados',
    excludeSlug: 'regalos-happy-8th-aniversario-frases',
  },
  {
    pattern: /\b(para tu esposa|dedicatorias para (?:mi|su) esposa|frases para tu esposa)\b/i,
    url: '/blog/regalos-aniversario-frases-para-esposa/',
    anchorText: 'frases de aniversario para mi esposa',
    excludeSlug: 'regalos-aniversario-frases-para-esposa',
  },
  {
    pattern: /\b(planes en pareja|actividades en pareja|planes románticos)\b/i,
    url: '/blog/regalos-things-to-do-for-aniversario/',
    anchorText: 'actividades románticas en pareja',
    excludeSlug: 'regalos-things-to-do-for-aniversario',
  },
  {
    pattern: /\b(fiesta de jubilación|código de vestimenta|celebrar la jubilación)\b/i,
    url: '/blog/regalos-what-wear-jubilacion-party/',
    anchorText: 'ropa para fiesta de jubilación',
    excludeSlug: 'regalos-what-wear-jubilacion-party',
  },
  {
    pattern: /\b(compañeros de trabajo|colegas de trabajo|despedida de un colega)\b/i,
    url: '/regalos-going-away-regalos-coworker/',
    anchorText: 'regalos para compañeros de trabajo',
    excludeSlug: 'regalos-going-away-regalos-coworker',
  },
  {
    pattern: /\b(mostrar agradecimiento|agradecimiento sincero|dar las gracias)\b/i,
    url: '/regalos-thank-you-regalos-ideas/',
    anchorText: 'regalos de agradecimiento',
    excludeSlug: 'regalos-thank-you-regalos-ideas',
  },
  {
    pattern: /\b(símbolos de Halloween|significado de Halloween)\b/i,
    url: '/blog/regalos-halloween-symbols-explained/',
    anchorText: 'símbolos de Halloween y su significado',
    excludeSlug: 'regalos-halloween-symbols-explained',
  },
  {
    pattern: /\b(dibujos de Halloween|dibujar en Halloween|manualidades de Halloween)\b/i,
    url: '/blog/regalos-halloween-drawing-ideas/',
    anchorText: 'ideas de dibujos para Halloween',
    excludeSlug: 'regalos-halloween-drawing-ideas',
  },
  {
    pattern: /\b(regalos de Halloween para novia|para tu novia en Halloween)\b/i,
    url: '/regalos-halloween-regalos-novia/',
    anchorText: 'regalos de Halloween para novia',
    excludeSlug: 'regalos-halloween-regalos-novia',
  },
  {
    pattern: /\b(personas espirituales|bienestar espiritual|salud espiritual)\b/i,
    url: '/regalos-para-spiritual-people/',
    anchorText: 'regalos para personas espirituales',
    excludeSlug: 'regalos-para-spiritual-people',
  },
  {
    pattern: /\b(hombres que aman viajar|viajeros hombres|viajes internacionales)\b/i,
    url: '/regalos-travel-regalos-men/',
    anchorText: 'regalos para viajeros hombres',
    excludeSlug: 'regalos-travel-regalos-men',
  },
  {
    pattern: /\b(adultos gemelos|para gemelos|gemelos)\b/i,
    url: '/regalos-twins-adults/',
    anchorText: 'regalos para gemelos adultos',
    excludeSlug: 'regalos-twins-adults',
  },
  {
    pattern: /\b(salud mental|autocuidado|bienestar emocional|paz interior)\b/i,
    url: '/regalos-mental-health/',
    anchorText: 'salud mental y autocuidado',
    excludeSlug: 'regalos-mental-health',
  },
  {
    pattern: /\b(madres solteras|madre soltera)\b/i,
    url: '/blog/regalos-single-mama-frases/',
    anchorText: 'frases de madre soltera',
    excludeSlug: 'regalos-single-mama-frases',
  },
  {
    pattern: /\b(videojuegos|amantes de los videojuegos|consolas)\b/i,
    url: '/regalos-pc-gamers/',
    anchorText: 'accesorios para gamers',
    excludeSlug: 'regalos-pc-gamers',
  },
  {
    pattern: /\b(juegos de mesa|juegos de mesa divertidos)\b/i,
    url: '/regalos-board-game-lovers/',
    anchorText: 'juegos de mesa',
    excludeSlug: 'regalos-board-game-lovers',
  },
  {
    pattern: /\b(accesorios para auto|accesorios de carro|viajes en carro)\b/i,
    url: '/regalos-car-regalos-men/',
    anchorText: 'accesorios de auto para hombres',
    excludeSlug: 'regalos-car-regalos-men',
  },
];

function injectAnchorsIntoHtml(html, currentSlug, maxLinks = 4) {
  if (!html) return { html, count: 0 };

  const usedUrls = new Set();
  const existingMatches = html.match(/href=["']([^"']+)["']/g) || [];
  for (const m of existingMatches) {
    const u = m.replace(/^href=["']|["']$/g, '');
    usedUrls.add(u);
  }

  let count = 0;

  // Replace strictly within <p> tags
  const updatedHtml = html.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (pTag, pContent) => {
    if (count >= maxLinks) return pTag;
    // Don't modify paragraph if it already contains links
    if (/<a\b/i.test(pContent)) return pTag;

    let modified = pContent;

    for (const rule of ANCHOR_RULES) {
      if (count >= maxLinks) break;
      if (rule.excludeSlug && (rule.excludeSlug === currentSlug || currentSlug.includes(rule.excludeSlug))) {
        continue;
      }
      if (usedUrls.has(rule.url)) {
        continue;
      }

      const match = rule.pattern.exec(modified);
      if (match) {
        const originalPhrase = match[0];
        const linkTag = `<a href="${rule.url}" style="color:#2563eb; font-weight:600; text-decoration:underline;">${originalPhrase}</a>`;
        
        modified = modified.replace(originalPhrase, linkTag);
        usedUrls.add(rule.url);
        count++;
        break; // Only 1 link per paragraph
      }
    }

    return pTag.replace(pContent, modified);
  });

  return { html: updatedHtml, count };
}

async function run() {
  console.log('=== INJECTING CONTEXTUAL IN-BODY ANCHOR LINKS INTO TOP PAGES ===');

  const auditPages = JSON.parse(fs.readFileSync('scripts/top-pages-audit.json', 'utf8')).filter(p => !p.not_found_in_db);
  console.log(`Processing ${auditPages.length} pages in Supabase...`);

  let totalUpdated = 0;
  let totalAnchors = 0;

  for (const item of auditPages) {
    const slug = item.db_slug;
    const { data: posts } = await sb
      .from('posts')
      .select('id, slug, title, intro_html, content_html')
      .eq('id', item.post_id)
      .limit(1);

    const post = posts?.[0];
    if (!post) continue;

    let intro = post.intro_html || '';
    let content = post.content_html || '';
    let modified = false;
    let postAnchorCount = 0;

    // 1. Try injecting into intro_html (very high SEO weight)
    if (intro) {
      const resIntro = injectAnchorsIntoHtml(intro, slug, 2);
      if (resIntro.count > 0) {
        intro = resIntro.html;
        modified = true;
        postAnchorCount += resIntro.count;
      }
    }

    // 2. Try injecting into content_html (in-body reading experience)
    if (content) {
      const remainingQuota = 4 - postAnchorCount;
      if (remainingQuota > 0) {
        const resContent = injectAnchorsIntoHtml(content, slug, remainingQuota);
        if (resContent.count > 0) {
          content = resContent.html;
          modified = true;
          postAnchorCount += resContent.count;
        }
      }
    }

    if (modified) {
      const { error: updateErr } = await sb
        .from('posts')
        .update({
          intro_html: intro,
          content_html: content,
          updated_at: new Date().toISOString(),
        })
        .eq('id', post.id);

      if (updateErr) {
        console.error(`Error updating post ${slug}:`, updateErr.message);
      } else {
        totalUpdated++;
        totalAnchors += postAnchorCount;
        console.log(`[Anchors Added] ${slug} -> +${postAnchorCount} contextual in-body links.`);
      }
    }
  }

  console.log(`\n🎉 COMPLETED: Successfully injected ${totalAnchors} in-body anchor links across ${totalUpdated} pages!`);
}

run().catch(console.error);
