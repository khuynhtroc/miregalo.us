import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { slugify } from '@/lib/urls';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file is empty or missing data rows' }, { status: 400 });
    }

    // Parse CSV header
    const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
    let importedCount = 0;
    const now = new Date().toISOString();

    if (type === 'products') {
      for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]);
        if (!values || values.length === 0 || !values[0]) continue;

        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });

        const name = row.name || row.title || row.product || '';
        if (!name) continue;

        const slug = row.slug || slugify(name);
        const tags = (row.tags || '').split(/[,;]/).map((t) => t.trim().toLowerCase()).filter(Boolean);

        await db.insert('products', {
          id: row.id || `prod-${Date.now().toString().slice(-4)}-${i}`,
          name,
          slug,
          merchant: row.merchant || 'Amazon España',
          merchant_id: row.merchant_id || 'mch-amazon-es',
          price: row.price || '29,99 €',
          currency: row.currency || 'EUR',
          url: row.url || 'https://www.amazon.es',
          image: row.image || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80',
          description: row.description || '',
          tags,
          clicks: 0,
          active: row.active !== 'false' && row.active !== '0',
          created_at: now,
          updated_at: now,
        });
        importedCount++;
      }
    } else if (type === 'merchants') {
      for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i]);
        if (!values || values.length === 0 || !values[0]) continue;

        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });

        const name = row.name || row.merchant || '';
        if (!name) continue;

        const slug = row.slug || slugify(name);

        await db.insert('merchants', {
          id: row.id || `mch-${slug}`,
          name,
          slug,
          website_url: row.website_url || row.url || 'https://example.com',
          affiliate_network: row.affiliate_network || row.network || 'Direct',
          affiliate_param: row.affiliate_param || row.param || '',
          commission_rate: row.commission_rate || row.rate || '',
          logo_url: row.logo_url || '',
          notes: row.notes || '',
          active: row.active !== 'false' && row.active !== '0',
          created_at: now,
          updated_at: now,
        });
        importedCount++;
      }
    } else {
      return NextResponse.json({ error: `Unsupported import type: ${type}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, importedCount });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error importing CSV';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Simple CSV line parser taking quotes into account
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}
