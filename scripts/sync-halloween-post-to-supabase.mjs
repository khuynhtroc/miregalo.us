import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tvgipyhvvtovgttnyivw.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const faqs = [
  {
    q: '¿Cómo se les llama a las fiestas de Halloween?',
    a: 'Popularmente se les conoce como <em>Noche de Brujas</em>, <em>Fiesta de Disfraces de Halloween</em>, <em>Baile de Máscaras Espeluznante</em>, <em>Aquelarre</em> o términos en inglés como <em>Boo Bash</em> y <em>Spooky Party</em>. La denominación varía según el tipo de público y el grado de formalidad de la celebración.'
  },
  {
    q: '¿Qué nombres puedo ponerle a una fiesta de Halloween?',
    a: 'Puedes elegir entre múltiples <strong>nombres para fiesta de Halloween</strong> según tu temática principal: si buscas terror puro, opciones como <strong>La Noche de las Pesadillas</strong> o <strong>La Casa de los Horrores</strong> son ideales; si prefieres diversión y copas con amigos, títulos como <strong>Noche de Brujas y Otras Hierbas</strong> o <strong>Spooky & Boozy</strong> funcionan a la perfección; y para niños, nombres como <strong>Boo Bash en Pumpkin Patch</strong> aportan un toque tierno y festivo.'
  },
  {
    q: '¿Qué nombres puedo usar para un grupo de WhatsApp de Halloween?',
    a: 'Para bautizar tu chat de coordinación, los mejores <strong>nombres para grupo de WhatsApp de Halloween</strong> incluyen: <em>El Aquelarre del Chat</em>, <em>¿Truco o Chisme?</em>, <em>Operación Halloween 31-O</em> o <em>Zombis en Línea</em>. Estos nombres generan expectación y mantienen al grupo activo mientras preparan sus atuendos.'
  },
  {
    q: '¿Cómo elegir el nombre perfecto para una fiesta de Halloween?',
    a: 'Para seleccionar el nombre ideal, te recomendamos definir la temática (terrorífico, humor, cine), adaptar el tono al público (adultos, niños o amigos), utilizar juegos de palabras memorables y colocar el nombre destacado en las invitaciones digitales o impresas.'
  }
];

async function sync() {
  const dbPath = path.join(process.cwd(), 'data', 'db.json');
  const dbRaw = await fs.readFile(dbPath, 'utf8');
  const localDb = JSON.parse(dbRaw);

  const localPost = localDb.posts.find((p) => p.slug === 'regalos-halloween-party-names');
  if (!localPost) {
    console.error('Post not found in local db.json');
    return;
  }

  // Add faqs to localPost as well
  localPost.faqs = faqs;
  localPost.focus_keyword = 'nombres para fiesta de halloween';
  await fs.writeFile(dbPath, JSON.stringify(localDb, null, 2), 'utf8');
  console.log('[1/2] Local db.json updated with FAQs and focus keyword.');

  // Update Supabase
  const updatePayload = {
    title: localPost.title,
    seo_title: localPost.seo_title,
    seo_description: localPost.seo_description,
    excerpt: localPost.excerpt,
    focus_keyword: 'nombres para fiesta de halloween',
    faqs: faqs,
    content_html: localPost.content_html,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await sb
    .from('posts')
    .update(updatePayload)
    .eq('slug', 'regalos-halloween-party-names')
    .select('id, slug, title, updated_at');

  if (error) {
    console.error('[2/2] Supabase update failed:', error);
  } else {
    console.log('[2/2] Supabase successfully updated:', data);
  }
}

sync();
