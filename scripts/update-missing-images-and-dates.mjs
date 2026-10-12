import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const url = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(url, key);

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

const NOW = new Date().toISOString();

const POST_UPDATES = {
  'post-regalos-mama': {
    hero_image: 'https://media.miregalo.us/media/medium_necklace1_b337bcdf8b/medium_necklace1_b337bcdf8b.jpg',
    hero_alt: 'Guía de Regalos Especiales para Mamá',
    updated_at: NOW,
  },
  'post-regalos-digital-regalos-international-women-day': {
    hero_image: 'https://media.miregalo.us/media/heroes/hero_regalos_mujeres.jpg',
    hero_alt: 'La guía definitiva de regalos digitales para el Día Internacional de la Mujer',
    updated_at: NOW,
  },
  'post-regalos-papa': {
    hero_image: 'https://media.miregalo.us/media/heroes/hero_regalos_destinatarios.jpg',
    hero_alt: 'Guía de Regalos para Papá',
    updated_at: NOW,
  },
  'post-regalos-aniversario': {
    hero_image: 'https://media.miregalo.us/media/heroes/hero_regalos_parejas.jpg',
    hero_alt: 'Regalos para Aniversario',
    updated_at: NOW,
  },
  'post-regalos-couples': {
    hero_image: 'https://media.miregalo.us/media/heroes/hero_regalos_parejas.jpg',
    hero_alt: 'Regalos Especiales para Parejas',
    updated_at: NOW,
  },
  'post-regalos-animals': {
    hero_image: 'https://media.miregalo.us/media/heroes/hero_regalos_animales.jpg',
    hero_alt: 'Regalos para Amantes de los Animales',
    updated_at: NOW,
  },
  'post-regalos-navipapa': {
    hero_image: 'https://media.miregalo.us/media/heroes/hero_regalos_destinatarios.jpg',
    hero_alt: 'Regalos de Navidad',
    updated_at: NOW,
  },
  'post-regalos-cumpleanos': {
    hero_image: 'https://media.miregalo.us/media/heroes/hero_regalos_destinatarios.jpg',
    hero_alt: 'Regalos para Cumpleaños',
    updated_at: NOW,
  },
  'post-regalos-friends': {
    hero_image: 'https://media.miregalo.us/media/heroes/hero_regalos_parejas.jpg',
    hero_alt: 'Regalos para Amigos',
    updated_at: NOW,
  },
  'post-regalos-family': {
    hero_image: 'https://media.miregalo.us/media/heroes/hero_regalos_destinatarios.jpg',
    hero_alt: 'Regalos para la Familia',
    updated_at: NOW,
  },
  'post-regalos-regalos': {
    hero_image: 'https://media.miregalo.us/media/heroes/hero_regalos_destinatarios.jpg',
    hero_alt: 'Catálogo y Guías de Regalos',
    updated_at: NOW,
  },
};

const CATEGORY_UPDATES = {
  '63a17312-80aa-4f05-b600-1d2685949f5a': {
    // Mamá
    hero_image: 'https://media.miregalo.us/media/medium_necklace1_b337bcdf8b/medium_necklace1_b337bcdf8b.jpg',
    updated_at: NOW,
  },
  '171f4470-486b-4158-bebb-1dadbd3a2661': {
    // Papá
    hero_image: 'https://media.miregalo.us/media/heroes/hero_regalos_destinatarios.jpg',
    updated_at: NOW,
  },
  'b6cdf54e-27ac-41a0-b8d5-42ba8b5251bb': {
    // Parejas
    hero_image: 'https://media.miregalo.us/media/heroes/hero_regalos_parejas.jpg',
    updated_at: NOW,
  },
  '1219239e-f8b0-41fd-bb10-7f2e68a6dadf': {
    // Mujeres
    hero_image: 'https://media.miregalo.us/media/heroes/hero_regalos_mujeres.jpg',
    updated_at: NOW,
  },
  '9b13a30b-daa5-4d73-890b-d66467788645': {
    // Amantes de los animales
    hero_image: 'https://media.miregalo.us/media/heroes/hero_regalos_animales.jpg',
    updated_at: NOW,
  },
  '6edf1013-c67e-407d-9428-92db0c722d9e': {
    // Bodas
    hero_image: 'https://media.miregalo.us/media/heroes/hero_regalos_boda.jpg',
    updated_at: NOW,
  },
  'b3307b6d-9ccb-4a3b-b94a-be776c0c46ed': {
    // San Valentín
    hero_image: 'https://media.miregalo.us/media/heroes/hero_regalos_san_valentin.jpg',
    updated_at: NOW,
  },
};

async function main() {
  console.log('--- UPDATING HERO IMAGES AND RECENT DATES FOR POSTS & CATEGORIES ---');

  // 1. Update posts in Supabase
  for (const [id, data] of Object.entries(POST_UPDATES)) {
    const { error } = await sb.from('posts').update(data).eq('id', id);
    if (error) console.error(`Error updating post ${id}:`, error.message);
    else console.log(`✅ [Post] ${id} -> image added & updated_at set to ${data.updated_at}`);
  }

  // 2. Update categories in Supabase
  for (const [id, data] of Object.entries(CATEGORY_UPDATES)) {
    const { error } = await sb.from('categories').update(data).eq('id', id);
    if (error) console.error(`Error updating category ${id}:`, error.message);
    else console.log(`✅ [Category] ${id} -> image added & updated_at set`);
  }

  // 3. Update local db.json
  if (fs.existsSync(DB_PATH)) {
    const dbData = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));

    if (Array.isArray(dbData.posts)) {
      for (const p of dbData.posts) {
        if (POST_UPDATES[p.id]) {
          Object.assign(p, POST_UPDATES[p.id]);
        }
      }
    }

    if (Array.isArray(dbData.categories)) {
      for (const c of dbData.categories) {
        if (CATEGORY_UPDATES[c.id]) {
          Object.assign(c, CATEGORY_UPDATES[c.id]);
        }
      }
    }

    fs.writeFileSync(DB_PATH, JSON.stringify(dbData, null, 2), 'utf8');
    console.log('✅ Local data/db.json updated successfully!');
  }

  console.log('\n🎉 ALL DONE! Images and updated_at timestamps populated!');
}

main().catch(console.error);
