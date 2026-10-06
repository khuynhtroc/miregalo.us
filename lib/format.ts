export function fmtDate(iso: string | null | undefined, locale = 'es'): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function rfc822(iso: string | null | undefined): string {
  return iso ? new Date(iso).toUTCString() : new Date().toUTCString();
}

export function stripHtml(html: string): string {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function truncate(s: string, n: number): string {
  if (!s || s.length <= n) return s || '';
  return s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';
}

export function escapeXml(s: string): string {
  return (s || '').replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]!);
}

export function wordCount(html: string): number {
  const t = stripHtml(html);
  return t ? t.split(' ').length : 0;
}
