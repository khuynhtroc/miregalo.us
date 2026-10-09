import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateMultiStageArticle } from '@/lib/ai/multi-stage-generator';

export const maxDuration = 300; // Allow up to 5 minutes on Vercel Pro/serverless

export async function GET(req: NextRequest) {
  return handleCronPublish(req);
}

export async function POST(req: NextRequest) {
  return handleCronPublish(req);
}

async function handleCronPublish(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const force = searchParams.get('force') === 'true';
  const limitParam = parseInt(searchParams.get('limit') || '1', 10);
  const targetJobId = searchParams.get('job_id');

  // Verify auth header if CRON_SECRET is configured
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && !force) {
    return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
  }

  try {
    // 1. Fetch scheduled jobs from Supabase
    const { rows: allJobs } = await db.find('content_jobs', {
      order: [{ field: 'created_at', asc: true }],
      limit: 500,
    });

    const now = new Date();

    // Filter pending/scheduled jobs
    const pendingJobs = allJobs.filter((j: any) => {
      if (targetJobId) return j.id === targetJobId;
      const payload = j.payload || {};
      const status = payload.status || 'scheduled';
      if (status !== 'scheduled') return false;

      if (force) return true;
      if (!payload.scheduled_for) return true;
      const scheduledTime = new Date(payload.scheduled_for);
      return scheduledTime <= now;
    });

    if (pendingJobs.length === 0) {
      return NextResponse.json({
        message: 'No pending scheduled jobs to execute at this time',
        time: now.toISOString(),
        total_queued: allJobs.filter((j: any) => j.payload?.status === 'scheduled').length,
      });
    }

    const jobsToProcess = pendingJobs.slice(0, Math.min(limitParam, 3));
    const results = [];

    for (const job of jobsToProcess) {
      const payload = job.payload || {};
      console.log(`[Cron] Processing job ${job.id} for topic: "${payload.topic}"`);

      // Update stage to draft / processing
      await db.update('content_jobs', job.id, {
        stage: 'draft',
        updated_at: new Date().toISOString(),
        payload: { ...payload, status: 'processing' },
      });

      try {
        const genResult = await generateMultiStageArticle({
          topic: payload.topic,
          cluster: payload.cluster,
          silo: payload.silo,
          keyword_id: job.keyword_id || undefined,
          target_slug: payload.target_path,
          min_words: payload.min_words || 5000,
          affiliate_tag: payload.affiliate_tag || 'miregalo26-20',
          publish: true,
        });

        // Mark as done
        await db.update('content_jobs', job.id, {
          stage: 'done',
          updated_at: new Date().toISOString(),
          payload: { ...payload, status: 'published' },
          result: {
            post_id: genResult.post.id,
            slug: genResult.post.slug,
            word_count: genResult.wordCount,
            item_count: genResult.itemCount,
            hero_image: genResult.heroImageUrl,
            published_at: new Date().toISOString(),
          },
        });

        results.push({
          job_id: job.id,
          topic: payload.topic,
          slug: genResult.post.slug,
          word_count: genResult.wordCount,
          items: genResult.itemCount,
          status: 'success',
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`[Cron] Error processing job ${job.id}:`, err);
        await db.update('content_jobs', job.id, {
          stage: 'error',
          error: errorMsg,
          updated_at: new Date().toISOString(),
          payload: { ...payload, status: 'failed' },
        });

        results.push({
          job_id: job.id,
          topic: payload.topic,
          status: 'error',
          error: errorMsg,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Cron] Cron handler exception:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
