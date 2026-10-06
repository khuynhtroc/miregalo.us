import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), 'data', 'scraped-cache.json');
const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));

// Test English-to-Spanish translation rules for gift topics
const recipientMap = [
  { match: /\b(boyfriend|bf)\b/i, es: 'para novio', cat: 'para-parejas', catalog: '/regalos/para-novio/' },
  { match: /\b(girlfriend|gf)\b/i, es: 'para novia', cat: 'para-parejas', catalog: '/regalos/para-novia/' },
  { match: /\b(husband)\b/i, es: 'para esposo', cat: 'para-parejas', catalog: '/regalos/para-esposo/' },
  { match: /\b(wife)\b/i, es: 'para esposa', cat: 'para-parejas', catalog: '/regalos/para-esposa/' },
  { match: /\b(couple|couples|dating|him and her)\b/i, es: 'para parejas', cat: 'para-parejas', catalog: '/regalos/aniversario/' },
  { match: /\b(mom|mother|mama|mother-in-law|mothers)\b/i, es: 'para mamá', cat: 'para-mama', catalog: '/regalos/para-mama/' },
  { match: /\b(dad|father|papa|father-in-law|fathers)\b/i, es: 'para papá', cat: 'para-papa', catalog: '/regalos/para-papa/' },
  { match: /\b(grandma|grandmother|nana|granny)\b/i, es: 'para abuela', cat: 'para-mama', catalog: '/regalos/para-abuela/' },
  { match: /\b(grandpa|grandfather|grandparents)\b/i, es: 'para abuelo', cat: 'para-papa', catalog: '/regalos/para-abuelo/' },
  { match: /\b(sister|sister-in-law)\b/i, es: 'para hermana', cat: 'para-mujeres', catalog: '/regalos/para-hermana/' },
  { match: /\b(brother|brother-in-law)\b/i, es: 'para hermano', cat: 'para-hombres', catalog: '/regalos/para-hermano/' },
  { match: /\b(daughter|daughter-in-law)\b/i, es: 'para hija', cat: 'para-mujeres', catalog: '/regalos/para-hija/' },
  { match: /\b(son|son-in-law)\b/i, es: 'para hijo', cat: 'para-hombres', catalog: '/regalos/para-hijo/' },
  { match: /\b(best-friend|best-friends|bff|female-friend)\b/i, es: 'para mejor amiga', cat: 'para-amigos', catalog: '/regalos/para-amiga/' },
  { match: /\b(friend|friends|friendship)\b/i, es: 'para amigos', cat: 'para-amigos', catalog: '/regalos/para-amigos/' },
  { match: /\b(teacher|teachers|professor)\b/i, es: 'para maestros', cat: 'para-todos', catalog: '/regalos/para-maestra/' },
  { match: /\b(nurse|nurses|doctor)\b/i, es: 'para enfermeras y médicos', cat: 'para-mujeres', catalog: '/regalos/para-amiga/' },
  { match: /\b(coworker|coworkers|colleagues|boss|employee)\b/i, es: 'para compañeros de trabajo', cat: 'para-amigos', catalog: '/regalos/para-amigo/' },
  { match: /\b(dog|dogs|dog-lovers|cat|cats|pet-lovers)\b/i, es: 'para amantes de las mascotas', cat: 'animales', catalog: '/regalos/originales/' },
  { match: /\b(men|him|guy|guys|male)\b/i, es: 'para él', cat: 'para-hombres', catalog: '/regalos/para-hombres/' },
  { match: /\b(women|her|female|ladies)\b/i, es: 'para ella', cat: 'para-mujeres', catalog: '/regalos/para-mujeres/' },
  { match: /\b(teen|teens|teenage|boys|boy)\b/i, es: 'para adolescentes', cat: 'para-ninos-y-adolescentes', catalog: '/regalos/para-ninos-y-adolescentes/' },
  { match: /\b(kids|children|toddler|baby)\b/i, es: 'para niños y bebés', cat: 'para-ninos-y-adolescentes', catalog: '/regalos/para-ninos-y-adolescentes/' },
];

const occasionMap = [
  { match: /\b(1-month-anniversary|first-month-anniversary)\b/i, es: 'primer mes de aniversario', cat: 'aniversario', catalog: '/regalos/aniversario/' },
  { match: /\b(1-year-anniversary|1st-anniversary)\b/i, es: '1 año de aniversario', cat: 'aniversario', catalog: '/regalos/aniversario/' },
  { match: /\b(2-year-anniversary|2nd-anniversary)\b/i, es: '2 años de aniversario', cat: 'aniversario', catalog: '/regalos/aniversario/' },
  { match: /\b(3-year-anniversary|3rd-anniversary)\b/i, es: '3 años de aniversario', cat: 'aniversario', catalog: '/regalos/aniversario/' },
  { match: /\b(4-year-anniversary|4th-anniversary)\b/i, es: '4 años de aniversario', cat: 'aniversario', catalog: '/regalos/aniversario/' },
  { match: /\b(5-year-anniversary|5th-anniversary|wooden-anniversary|wood-anniversary)\b/i, es: 'bodas de madera (5 años)', cat: 'aniversario', catalog: '/regalos/aniversario/' },
  { match: /\b(10-year-anniversary|10th-anniversary|tin-anniversary)\b/i, es: 'bodas de aluminio (10 años)', cat: 'aniversario', catalog: '/regalos/aniversario/' },
  { match: /\b(25-year-anniversary|silver-anniversary)\b/i, es: 'bodas de plata (25 años)', cat: 'aniversario', catalog: '/regalos/aniversario/' },
  { match: /\b(50-year-anniversary|golden-anniversary)\b/i, es: 'bodas de oro (50 años)', cat: 'aniversario', catalog: '/regalos/aniversario/' },
  { match: /\b(anniversary|anniversaries)\b/i, es: 'aniversario', cat: 'aniversario', catalog: '/regalos/aniversario/' },
  { match: /\b(birthday|birthdays|bday|1st-birthday|2-year-old|6-year-old)\b/i, es: 'cumpleaños', cat: 'cumpleanos', catalog: '/regalos/cumpleanos/' },
  { match: /\b(valentine|valentines|valentines-day)\b/i, es: 'San Valentín', cat: 'san-valentin', catalog: '/regalos/san-valentin/' },
  { match: /\b(christmas|xmas|stocking-stuffer|secret-santa|white-elephant)\b/i, es: 'Navidad y Reyes', cat: 'navidad', catalog: '/regalos/navidad/' },
  { match: /\b(mothers-day|mother-day)\b/i, es: 'Día de la Madre', cat: 'para-mama', catalog: '/regalos/dia-de-la-madre/' },
  { match: /\b(fathers-day|father-day)\b/i, es: 'Día del Padre', cat: 'para-papa', catalog: '/regalos/dia-del-padre/' },
  { match: /\b(wedding|weddings|bridal|bride|groom)\b/i, es: 'bodas', cat: 'bodas', catalog: '/regalos/bodas/' },
  { match: /\b(graduation|grad)\b/i, es: 'graduación', cat: 'graduacion', catalog: '/regalos/originales/' },
  { match: /\b(housewarming|new-home|moving)\b/i, es: 'nueva casa e inauguración', cat: 'nueva-casa', catalog: '/regalos/originales/' },
  { match: /\b(retirement|retire)\b/i, es: 'jubilación', cat: 'populares', catalog: '/regalos/originales/' },
  { match: /\b(baby-shower|new-baby|expecting|new-mom)\b/i, es: 'baby shower y recién nacido', cat: 'para-mama', catalog: '/regalos/para-mama/' },
];

const sampleKeys = Object.keys(cache).slice(0, 30);
console.log('Testing 30 sample articles translation & classification:');
for (const key of sampleKeys) {
  const art = cache[key];
  const origSlug = art.originalSlug;
  const title = art.title;

  let matchedRecipient = recipientMap.find(r => r.match.test(origSlug) || r.match.test(title));
  let matchedOccasion = occasionMap.find(o => o.match.test(origSlug) || o.match.test(title));

  let category = matchedOccasion?.cat || matchedRecipient?.cat || 'regalos';
  let catalogUrl = matchedOccasion?.catalog || matchedRecipient?.catalog || '/regalos/originales/';

  console.log(`Original: [${origSlug}]`);
  console.log(`  Title: ${title.slice(0, 50)}...`);
  console.log(`  Mapped: Recipient: ${matchedRecipient?.es || 'general'} | Occasion: ${matchedOccasion?.es || 'general'}`);
  console.log(`  Category: ${category} | Catalog URL: ${catalogUrl}`);
  console.log('---');
}
