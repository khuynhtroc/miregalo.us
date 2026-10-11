import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const url = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(url, key);

const dbPath = 'data/db.json';
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// 1. Definition of the 5 new interest categories
const newCategories = [
  {
    id: "d1a2b3c4-0001-4000-8000-000000000001",
    slug: "hogar-y-decoracion",
    name: "Hogar y Decoración",
    group: "interests",
    eyebrow: "Estilo y confort",
    short_intro: "Ideas de diseño, decoración acogedora y detalles para transformar cualquier espacio.",
    description_html: "<p>Ideas de diseño, decoración acogedora y detalles para transformar cualquier espacio.</p>",
    hero_image: "",
    seo_title: "Regalos de Hogar y Decoración | Miregalo",
    seo_description: "Descubre los mejores regalos para el hogar y decoración. Detalles elegantes y funcionales.",
    sort_order: 33,
    show_in_nav: true,
    show_in_footer: true,
    quick_link: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "d1a2b3c4-0002-4000-8000-000000000002",
    slug: "cocina-y-gourmet",
    name: "Cocina y Gourmet",
    group: "interests",
    eyebrow: "Para sibaritas",
    short_intro: "Detalles irresistibles para amantes del café, vino selecto, repostería y la alta cocina.",
    description_html: "<p>Detalles irresistibles para amantes del café, vino selecto, repostería y la alta cocina.</p>",
    hero_image: "",
    seo_title: "Regalos de Cocina y Gourmet | Miregalo",
    seo_description: "Ideas de regalos gourmet y cocina para amantes de la buena mesa y la gastronomía.",
    sort_order: 34,
    show_in_nav: true,
    show_in_footer: true,
    quick_link: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "d1a2b3c4-0003-4000-8000-000000000003",
    slug: "arte-y-creatividad",
    name: "Arte y Creatividad",
    group: "interests",
    eyebrow: "Mundo creativo",
    short_intro: "Inspiración para mentes artísticas, aficionados al dibujo, la música, manualidades y fotografía.",
    description_html: "<p>Inspiración para mentes artísticas, aficionados al dibujo, la música, manualidades y fotografía.</p>",
    hero_image: "",
    seo_title: "Regalos de Arte y Creatividad | Miregalo",
    seo_description: "Regalos creativos y artísticos para inspirar la imaginación y el talento.",
    sort_order: 35,
    show_in_nav: true,
    show_in_footer: true,
    quick_link: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "d1a2b3c4-0004-4000-8000-000000000004",
    slug: "viajes-y-aventura",
    name: "Viajes y Aventura",
    group: "interests",
    eyebrow: "Espíritu viajero",
    short_intro: "Accesorios prácticos y detalles inolvidables para trotamundos, escapadas y aventuras.",
    description_html: "<p>Accesorios prácticos y detalles inolvidables para trotamundos, escapadas y aventuras.</p>",
    hero_image: "",
    seo_title: "Regalos para Viajeros y Aventura | Miregalo",
    seo_description: "Los mejores regalos y accesorios para amantes de los viajes y la aventura.",
    sort_order: 36,
    show_in_nav: true,
    show_in_footer: true,
    quick_link: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "d1a2b3c4-0005-4000-8000-000000000005",
    slug: "tecnologia-y-gaming",
    name: "Tecnología y Gaming",
    group: "interests",
    eyebrow: "Innovación y ocio",
    short_intro: "Los gadgets más novedosos, periféricos para gamers, accesorios electrónicos y entretenimiento.",
    description_html: "<p>Los gadgets más novedosos, periféricos para gamers, accesorios electrónicos y entretenimiento.</p>",
    hero_image: "",
    seo_title: "Regalos de Tecnología y Gaming | Miregalo",
    seo_description: "Ideas de regalos de tecnología, videojuegos y gadgets para amantes de la innovación.",
    sort_order: 37,
    show_in_nav: true,
    show_in_footer: true,
    quick_link: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

async function main() {
  console.log('--- STEP 1: Updating Categories in db.json & Supabase ---');
  db.categories = db.categories || [];
  for (const nc of newCategories) {
    const existingIdx = db.categories.findIndex(c => c.slug === nc.slug);
    if (existingIdx >= 0) {
      db.categories[existingIdx] = { ...db.categories[existingIdx], ...nc };
    } else {
      db.categories.push(nc);
    }

    // Upsert into Supabase
    const { error } = await sb.from('categories').upsert(nc, { onConflict: 'slug' });
    if (error) {
      console.error(`Error upserting category ${nc.slug} to Supabase:`, error);
    } else {
      console.log(`✓ Category synced: ${nc.name} (${nc.slug})`);
    }
  }

  // Create a fast map: slug -> id
  const catBySlug = Object.fromEntries(db.categories.map(c => [c.slug, c.id]));

  console.log('\n--- STEP 2: Matching Posts to Target Categories ---');

  const rules = [
    {
      slug: 'para-parejas',
      name: 'Parejas',
      matcher: (t, s) =>
        /\b(pareja|parejas|novio|novios|novia|novias|esposo|esposos|esposa|esposas|matrimonio|matrimonios|rom[aá]ntic[oa]s?|enamorad[oa]s?|citas nocturnas)\b/i.test(t) ||
        /pareja|novio|novia|esposo|esposa|matrimonio/i.test(s),
      max: 60
    },
    {
      slug: 'para-todos',
      name: 'Para Todos',
      matcher: (t, s) =>
        /\b(para todos|para toda la familia|amigo invisible|intercambio de regalos|regalo universal|para cualquier persona|unisex|amantes del arte|amantes de la m[uú]sica|regalos est[eé]ticos|detalles universales|para todos los gustos|econ[oó]micos y divertidos)\b/i.test(t) ||
        /para-todos|amigo-invisible|intercambio|universal/i.test(s),
      max: 45
    },
    {
      slug: 'nueva-casa',
      name: 'Nueva Casa',
      matcher: (t, s) =>
        /\b(casa nueva|nueva casa|inauguraci[oó]n|mudanza|primer hogar|para el hogar|decoraci[oó]n de (la )?casa|decoraci[oó]n del hogar|decoraci[oó]n de casas|para la casa|ba[ñn]o de tu hogar|decoraci[oó]n de ba[ñn]o|decoraci[oó]n navide[ñn]a para el hogar|decoraci[oó]n de mesas|en casa|iluminar tu jard[ií]n)\b/i.test(t) ||
        /nueva-casa|inauguracion|mudanza|hogar|casa-nueva/i.test(s),
      max: 35
    },
    {
      slug: 'populares',
      name: 'Populares',
      matcher: (t, s, p) =>
        p.featured || p.editor_pick || (p.view_count && p.view_count > 50) ||
        /\b(m[aá]s vendidos|favoritos|imprescindibles|gu[íi]a definitiva|ideas m[aá]s populares|top regalos|los mejores regalos|las mejores ideas)\b/i.test(t),
      max: 40
    },
    {
      slug: 'deportes-y-aire-libre',
      name: 'Deportes y Aire Libre',
      matcher: (t, s) =>
        /\b(deport(e|es|ivo|iva)|fitness|gimnasio|gym|entrenador|entrenamiento|corredor(es)?|runner|senderismo|camping|al aire libre|aire libre|bicicleta|ciclismo|yoga|aventura|f[uú]tbol|baloncesto|golf|b[eé]isbol|pesca|acampar)\b/i.test(t) ||
        /deport|fitness|gym|senderismo|camping|aire-libre|bici|futbol|golf/i.test(s),
      max: 35
    },
    {
      slug: 'hogar-y-decoracion',
      name: 'Hogar y Decoración',
      matcher: (t, s) =>
        /\b(decoraci[oó]n|decorar|coj[ií]n|manta|vela(s)?|l[aá]mpara|aromaterapia|organizador|jard[ií]n|planta(s)?|maceta|estilo del hogar|cuadro|dise[ñn]o interior)\b/i.test(t) ||
        /decoracion|hogar|lampara|vela|plantas/i.test(s),
      max: 35
    },
    {
      slug: 'cocina-y-gourmet',
      name: 'Cocina y Gourmet',
      matcher: (t, s) =>
        /\b(cocina|cocinar|cocinero|chef|caf[eé]|cafetera|barista|vino(s)?|cerveza(s)?|cerveceros?|gourmet|gastronom[ií]a|parrilla|barbacoa|reposter[ií]a|taza(s)?|dulces|chocolate|c[oó]ctel)\b/i.test(t) ||
        /cocina|cafe|vino|cerveza|gourmet|chef|parrilla/i.test(s),
      max: 30
    },
    {
      slug: 'arte-y-creatividad',
      name: 'Arte y Creatividad',
      matcher: (t, s) =>
        /\b(arte|artista(s)?|art[ií]stico|pintura|pintar|dibujo(s)?|manualidad(es)?|creativid(ad)?|fotograf[ií]a|fot[oó]grafo|m[uú]sica|m[uú]sico(s)?|guitarra|instrumento|escritura|libro(s)?|scrapbook)\b/i.test(t) ||
        /arte|artista|dibujo|pintura|manualidad|fotografia|musica/i.test(s),
      max: 35
    },
    {
      slug: 'viajes-y-aventura',
      name: 'Viajes y Aventura',
      matcher: (t, s) =>
        /\b(viaje(s)?|viajero(s)?|viajera(s)?|viajar|maleta(s)?|escapada(s)?|pasaporte|mochiler(o|a)|mochila(s)?|turismo|vacaciones|crucero|excursi[oó]n|camping|escapadas)\b/i.test(t) ||
        /viaje|viajero|maleta|escapada|aventura|turismo/i.test(s),
      max: 35
    },
    {
      slug: 'tecnologia-y-gaming',
      name: 'Tecnología y Gaming',
      matcher: (t, s) =>
        /\b(tecnolog[ií]a|gadget(s)?|reloj inteligente|smartwatch|auricular(es)?|inal[aá]mbrico(s)?|videojuego(s)?|gaming|gamer(s)?|electr[oó]nica|consola|teclado|ordenador|pc|juego(s)? de interior|juego(s)? de mesa)\b/i.test(t) ||
        /tecnolog|gadget|smartwatch|gaming|gamer|auricular|videojuegos/i.test(s),
      max: 25
    }
  ];

  const modifiedPosts = new Map();

  for (const rule of rules) {
    const catId = catBySlug[rule.slug];
    if (!catId) {
      console.warn(`Category not found for slug: ${rule.slug}`);
      continue;
    }
    let matchedCount = 0;
    for (const post of db.posts) {
      if (rule.matcher(post.title, post.slug, post)) {
        const cids = Array.isArray(post.category_ids) ? [...post.category_ids] : [];
        if (!cids.includes(catId)) {
          cids.push(catId);
          post.category_ids = cids;
          modifiedPosts.set(post.id, cids);
        }
        matchedCount++;
        if (matchedCount >= rule.max) break;
      }
    }
    console.log(`Assigned to [${rule.name}] (${rule.slug}): ${matchedCount} posts`);
  }

  console.log(`\nTotal posts with modified categories: ${modifiedPosts.size}`);

  // Save to db.json
  console.log('\n--- STEP 3: Saving to data/db.json ---');
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  console.log('✓ Successfully saved updated db.json');

  // Update Supabase in batches
  console.log('\n--- STEP 4: Updating posts in Supabase ---');
  const postUpdates = Array.from(modifiedPosts.entries());
  const batchSize = 50;
  let successCount = 0;

  for (let i = 0; i < postUpdates.length; i += batchSize) {
    const chunk = postUpdates.slice(i, i + batchSize);
    await Promise.all(chunk.map(async ([id, category_ids]) => {
      const { error } = await sb.from('posts').update({ category_ids }).eq('id', id);
      if (error) {
        console.error(`Error updating post ${id} in Supabase:`, error.message);
      } else {
        successCount++;
      }
    }));
    process.stdout.write(`\rUpdated ${Math.min(i + batchSize, postUpdates.length)} / ${postUpdates.length} posts in Supabase...`);
  }
  console.log(`\n✓ Supabase update completed! ${successCount} posts updated successfully.`);

  // Verify final counts
  console.log('\n--- STEP 5: Verification of Directory Counts ---');
  const finalCounts = {};
  for (const p of db.posts) {
    for (const cid of p.category_ids || []) {
      finalCounts[cid] = (finalCounts[cid] || 0) + 1;
    }
  }

  const groups = {};
  for (const c of db.categories) {
    if (c.group === 'hub' || c.group === 'blog') continue;
    groups[c.group] = groups[c.group] || [];
    groups[c.group].push({
      name: c.name,
      slug: c.slug,
      count: finalCounts[c.id] || 0
    });
  }

  for (const [grp, cats] of Object.entries(groups)) {
    console.log(`\n=== ${grp.toUpperCase()} (${cats.length} categorías) ===`);
    for (const c of cats) {
      console.log(`  ${c.name.padEnd(28)} [${c.slug}]: ${c.count} artículos`);
    }
  }
}

main().catch(console.error);
