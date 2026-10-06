// Resets the local JSON database (data/db.json) from data/seed.json
import { copyFileSync, existsSync } from 'fs';
import path from 'path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const seed = path.join(root, 'data', 'seed.json');
const dbf = path.join(root, 'data', 'db.json');
if (!existsSync(seed)) {
  console.error('data/seed.json not found – run npm run seed:build first');
  process.exit(1);
}
copyFileSync(seed, dbf);
console.log('data/db.json reset from seed.json');
