import { db } from '@/lib/db';
import { getCategories } from '@/lib/repo';
import { GiftGuidesClient, type CompactGiftGuide, type CompactScheduledJob } from './GiftGuidesClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gift Guides Management Hub | Admin Miregalo',
};

export default async function AdminGiftGuidesPage() {
  // Fetch categories, gift posts and scheduled jobs in parallel
  const [categories, postsRes, jobsRes] = await Promise.all([
    getCategories(),
    db.find('posts', {
      eq: { type: 'gift' },
      order: [{ field: 'created_at', asc: false }],
      limit: 2000,
    }),
    db.find('content_jobs', {
      order: [{ field: 'created_at', asc: true }],
      limit: 1000,
    }),
  ]);

  // Format compact gift guides for ultra-fast, smooth client rendering
  const initialGuides: CompactGiftGuide[] = (postsRes.rows || []).map((p: any) => {
    // Calculate price range from items
    const prices = (p.items || [])
      .map((i: any) => parseFloat((i.price || '').replace(/[^0-9.]/g, '')))
      .filter((n: number) => !isNaN(n) && n > 0);

    const priceRange =
      prices.length > 0
        ? `$${Math.min(...prices)} – $${Math.max(...prices)}`
        : '$15 – $90';

    return {
      id: p.id,
      title: p.title || 'Untitled Guide',
      slug: p.slug,
      status: p.status || 'published',
      primary_category_id: p.primary_category_id || null,
      category_ids: p.category_ids || [],
      hero_image: p.hero_image || '',
      focus_keyword: p.focus_keyword || '',
      excerpt: p.excerpt || '',
      published_at: p.published_at || p.created_at || null,
      updated_at: p.updated_at || p.created_at || '',
      created_at: p.created_at || '',
      itemCount: p.items?.length || 0,
      faqCount: p.faqs?.length || 0,
      priceRange,
    };
  });

  // Format compact scheduled jobs (sorted chronologically by scheduled_for)
  const scheduledJobs: CompactScheduledJob[] = (jobsRes.rows || [])
    .map((j: any) => {
      const payload = j.payload || {};
      return {
        id: j.id,
        topic: j.topic || payload.topic || j.keyword_id || 'Untitled Job',
        target_path: j.target_path || payload.target_path || '',
        cluster: payload.cluster || 'General',
        silo: payload.silo || 'RECIPIENT',
        scheduled_for: payload.scheduled_for || null,
        model: j.model || payload.model || 'gemini-2.5-flash',
        min_words: payload.min_words || 5000,
        status: j.status || payload.status || 'scheduled',
        image_model: payload.image_model || 'imagen-3.0-generate-002',
        affiliate_tag: payload.affiliate_tag || 'miregalo26-20',
      };
    })
    .sort((a, b) => {
      const timeA = a.scheduled_for ? new Date(a.scheduled_for).getTime() : Infinity;
      const timeB = b.scheduled_for ? new Date(b.scheduled_for).getTime() : Infinity;
      return timeA - timeB;
    });

  return (
    <GiftGuidesClient
      initialGuides={initialGuides}
      scheduledJobs={scheduledJobs}
      categories={categories}
    />
  );
}
