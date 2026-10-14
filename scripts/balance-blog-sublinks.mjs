import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const sbUrl = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const sbKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(sbUrl, sbKey);

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

const FRASES_ID = 'af2f3c09-6c84-4983-9275-8f16cad2dd52';
const FAMILIA_ID = 'dd882330-4cba-40f0-9773-2241e3942146';

const SUBLINKS_UPDATES = [
  // Frases y Dedicatorias sublinks
  {
    id: 'post-regalos-happy-30th-aniversario-frases',
    title: 'Más de 100 dedicatorias, citas y mensajes emotivos para celebrar un aniversario inolvidable',
    catId: FRASES_ID,
    publishedAt: '2026-10-10T14:59:00.000Z'
  },
  {
    id: 'post-regalos-divertidos-navipapa-movie-frases',
    title: 'Frases y citas divertidas de películas para compartir y hacer sonreír en cualquier reunión',
    catId: FRASES_ID,
    publishedAt: '2026-10-10T14:58:00.000Z'
  },
  // Familia sublinks
  {
    id: 'post-regalos-helicopter-parenting',
    title: 'Crianza consciente y positiva: claves para fortalecer el bienestar emocional de los hijos',
    catId: FAMILIA_ID,
    publishedAt: '2026-10-10T14:57:00.000Z'
  },
  {
    id: 'post-regalos-how-to-play-with-newborn',
    title: '14 actividades y consejos entrañables para compartir tiempo de calidad en familia',
    catId: FAMILIA_ID,
    publishedAt: '2026-10-10T14:56:00.000Z'
  }
];

async function main() {
  const dbData = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

  for (const item of SUBLINKS_UPDATES) {
    const pIdx = dbData.posts.findIndex(p => p.id === item.id);
    if (pIdx !== -1) {
      dbData.posts[pIdx].title = item.title;
      dbData.posts[pIdx].type = 'blog';
      dbData.posts[pIdx].primary_category_id = item.catId;
      const cids = new Set(dbData.posts[pIdx].category_ids || []);
      cids.add(item.catId);
      dbData.posts[pIdx].category_ids = Array.from(cids);
      dbData.posts[pIdx].published_at = item.publishedAt;
      dbData.posts[pIdx].updated_at = item.publishedAt;
    }

    const { error } = await sb.from('posts').update({
      title: item.title,
      type: 'blog',
      primary_category_id: item.catId,
      category_ids: [item.catId],
      published_at: item.publishedAt,
      updated_at: item.publishedAt
    }).eq('id', item.id);

    if (error) {
      console.error(`❌ Error updating ${item.id}:`, error);
    } else {
      console.log(`✅ [UPDATED] ${item.id} associated with category.`);
    }
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(dbData, null, 2), 'utf8');
  console.log('\n🎉 Successfully balanced sublinks across Frases and Familia!');
}

main().catch(console.error);
