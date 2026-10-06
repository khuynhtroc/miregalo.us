import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const root = process.cwd();
    const seedPath = path.join(root, 'data', 'seed.json');
    const dbPath = path.join(root, 'data', 'db.json');

    const seedRaw = await fs.readFile(seedPath, 'utf8');
    await fs.writeFile(dbPath, seedRaw);

    return NextResponse.json({ success: true, message: 'Database reset successfully from seed.json' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
