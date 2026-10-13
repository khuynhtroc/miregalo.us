import { NextResponse } from 'next/server';

export const dynamic = 'force-static';

export async function GET() {
  return new NextResponse('google.com, pub-2959580292222970, DIRECT, f08c47fec0942fa0\n', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
