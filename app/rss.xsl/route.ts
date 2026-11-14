import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

let cachedRssXsl: string | null = null;

export async function GET() {
  if (cachedRssXsl === null) {
    try {
      const filePath = path.join(process.cwd(), 'public', 'rss.xsl');
      cachedRssXsl = fs.readFileSync(filePath, 'utf-8');
    } catch {
      cachedRssXsl = '<?xml version="1.0" encoding="UTF-8"?><xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"/>';
    }
  }

  return new NextResponse(cachedRssXsl, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800',
    },
  });
}
