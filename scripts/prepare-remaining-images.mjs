import fs from 'fs';
import path from 'path';

const outDir = 'C:/Users/OK/.gemini/antigravity/brain/380e261e-4afc-43e6-983e-2e7980270fe1';

const targets = [
  {
    name: 'acrylic_sign_holders_hero.jpg',
    url: 'https://image.pollinations.ai/prompt/' + encodeURIComponent('Modern minimalist clear acrylic sign holder on an elegant wedding reception table with floral decor and menu card, beautiful professional photography, 8k') + '?width=1280&height=720&nologo=true'
  },
  {
    name: 'business_esim_asia_hero.jpg',
    url: 'https://image.pollinations.ai/prompt/' + encodeURIComponent('Modern business traveler holding smartphone with glowing global eSIM connectivity in front of illuminated Tokyo and Singapore modern skyscraper skyline at dusk, professional photo') + '?width=1280&height=720&nologo=true'
  },
  {
    name: 'regalos_navipapa_hero.jpg',
    url: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?w=1600&q=85'
  },
  {
    name: 'regalos_couples_hero.jpg',
    url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1600&q=85'
  },
  {
    name: 'regalos_papa_hero.jpg',
    url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1600&q=85'
  },
  {
    name: 'regalos_events_hero.jpg',
    url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1600&q=85'
  },
  {
    name: 'regalos_family_hero.jpg',
    url: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=1600&q=85'
  },
  {
    name: 'regalos_friends_hero.jpg',
    url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&q=85'
  },
  {
    name: 'mr_wattson_lamp_item.jpg',
    url: 'https://image.pollinations.ai/prompt/' + encodeURIComponent('Mr. Wattson articulated wooden desk lamp with vintage retro round headlight on wooden bedside table, warm ambient lighting, beautiful design product photography') + '?width=800&height=800&nologo=true'
  }
];

async function run() {
  console.log('Downloading and saving remaining images...');
  for (const t of targets) {
    const dest = path.join(outDir, t.name);
    console.log(`Fetching ${t.name}...`);
    try {
      const res = await fetch(t.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(dest, buffer);
      console.log(`Saved ${t.name} (${buffer.length} bytes)`);
    } catch (err) {
      console.error(`Failed to fetch ${t.name}:`, err.message);
    }
  }
}

run();
