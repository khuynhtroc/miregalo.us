import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { processContentJob } from '@/lib/ai/job-queue';
import { generateMultiStageArticle } from '@/lib/ai/multi-stage-generator';
import { autoSubmitPostIndexing } from '@/lib/indexing/google';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Context) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const job = await db.findOne('content_jobs', { id });
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  const payload = (job as any).payload || {};
  const normalized = {
    ...job,
    topic: (job as any).topic || payload.topic || (job as any).keyword_id || 'Untitled',
    target_path: (job as any).target_path || payload.target_path || '',
    status: (job as any).status || payload.status || ((job as any).stage === 'done' ? 'completed' : (job as any).stage === 'error' ? 'failed' : 'queued'),
    model: (job as any).model || payload.model || 'gemini-2.5-flash',
  };

  return NextResponse.json(normalized);
}

// Trigger processing or executing a job
export async function POST(_req: NextRequest, { params }: Context) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const job = (await db.findOne('content_jobs', { id })) as any;
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  const payload = job.payload || {};
  const topic = job.topic || payload.topic;

  // 1. Fast-path: If job references a pre-authored post (e.g. planned post), publish immediately without AI generation
  let plannedPost: any = null;
  if (job.result?.post_id) {
    plannedPost = await db.findOne('posts', { id: job.result.post_id });
  }
  if (!plannedPost && (job.result?.slug || payload.target_path)) {
    const targetSlug = (job.result?.slug || payload.target_path || '').replace(/^\/|\/$/g, '');
    if (targetSlug) {
      plannedPost = await db.findOne('posts', { slug: targetSlug });
    }
  }

  if (plannedPost && plannedPost.status !== 'published') {
    const nowIso = new Date().toISOString();
    await db.update('posts', plannedPost.id, {
      status: 'published',
      published_at: nowIso,
      updated_at: nowIso,
    });
    const updatedJob = await db.update('content_jobs', id, {
      stage: 'done',
      updated_at: nowIso,
      payload: { ...payload, status: 'published' },
      result: {
        ...job.result,
        post_id: plannedPost.id,
        slug: plannedPost.slug,
        word_count: plannedPost.content_html ? plannedPost.content_html.split(/\s+/).length : 5000,
        item_count: plannedPost.items?.length || 10,
        hero_image: plannedPost.hero_image,
        published_at: nowIso,
      },
    });

    // Auto submit to Google Indexing
    if (plannedPost.slug) {
      autoSubmitPostIndexing(plannedPost.slug, 'post').catch(() => {});
    }

    return NextResponse.json({
      success: true,
      job: {
        ...updatedJob,
        topic,
        status: 'completed',
      },
      generatedPost: plannedPost,
      wordCount: plannedPost.content_html ? plannedPost.content_html.split(/\s+/).length : 5000,
    });
  }

  // If this is a queued scheduled job with payload, execute via multi-stage generator
  if (topic) {
    try {
      await db.update('content_jobs', id, {
        stage: 'draft',
        updated_at: new Date().toISOString(),
        payload: { ...payload, status: 'processing' },
      });

      const res = await generateMultiStageArticle({
        topic,
        cluster: payload.cluster,
        silo: payload.silo,
        keyword_id: job.keyword_id,
        target_slug: job.target_path || payload.target_path,
        min_words: payload.min_words || 5000,
        affiliate_tag: payload.affiliate_tag || 'miregalo26-20',
        publish: true,
      });

      const updatedJob = await db.update('content_jobs', id, {
        stage: 'done',
        updated_at: new Date().toISOString(),
        payload: { ...payload, status: 'published' },
        result: {
          post_id: res.post.id,
          slug: res.post.slug,
          word_count: res.wordCount,
          item_count: res.itemCount,
          hero_image: res.heroImageUrl,
          published_at: new Date().toISOString(),
        },
      });

      // Auto submit to Google Indexing
      if (res.post?.slug) {
        autoSubmitPostIndexing(res.post.slug, 'post').catch(() => {});
      }

      return NextResponse.json({
        success: true,
        job: {
          ...updatedJob,
          topic,
          status: 'completed',
        },
        generatedPost: res.post,
        wordCount: res.wordCount,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      await db.update('content_jobs', id, {
        stage: 'error',
        error: errorMsg,
        updated_at: new Date().toISOString(),
        payload: { ...payload, status: 'failed' },
      });
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
  }

  // Fallback to legacy processContentJob
  const result = await processContentJob(id);
  return NextResponse.json(result);
}
