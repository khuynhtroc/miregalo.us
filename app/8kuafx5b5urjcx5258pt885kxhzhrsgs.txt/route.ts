import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET() {
  return new NextResponse('8kuafx5b5urjcx5258pt885kxhzhrsgs', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
