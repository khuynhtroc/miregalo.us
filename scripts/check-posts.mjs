import { createClient } from '@supabase/supabase-js';

const url = 'https://tvgipyhvvtovgttnyivw.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2Z2lweWh2dnRvdmd0dG55aXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTI0Mzg2OCwiZXhwIjoyMTA2ODE5ODY4fQ.n03zTL69UhHEk524ItXwcOtqu1MtvL1iu9uOoXH-oi0';
const sb = createClient(url, key);

async function main() {
  const { data: posts } = await sb.from('posts').select('id, slug, title, status, published_at').in('slug', [
    'regalos-halloween-para-adultos-ideas',
    'regalos-halloween-para-ninos-originales',
    'regalos-de-ultima-hora-para-papa',
  ]);
  console.log('Posts found:', posts);
}

main().catch(console.error);
