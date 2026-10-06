import { NextResponse } from 'next/server';
import { getStorageSettings, updateStorageSettings } from '@/lib/storage/service';

export async function GET() {
  try {
    const settings = await getStorageSettings();
    return NextResponse.json(settings);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load storage settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const updated = await updateStorageSettings(body);
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update storage settings' }, { status: 500 });
  }
}
