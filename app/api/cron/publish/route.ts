import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateMultiStageArticle } from '@/lib/ai/multi-stage-generator';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
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

  // Verify auth: Vercel Cron header, Bearer token, query secret, or force
  const isVercelCron = req.headers.get('x-vercel-cron') === '1';
  const authHeader = req.headers.get('authorization');
  const querySecret = searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && !isVercelCron && !force) {
    const isBearerValid = authHeader === `Bearer ${cronSecret}`;
    const isQueryValid = querySecret === cronSecret;
    if (!isBearerValid && !isQueryValid) {
      return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
    }
  }

  try {
    // 1. Fetch scheduled jobs from Supabase (up to 1000 to cover full queue)
    const { rows: allJobs } = await db.find('content_jobs', {
      order: [{ field: 'created_at', asc: true }],
      limit: 1000,
    });

    const now = new Date();
    const STALE_ZOMBIE_MS = 10 * 60 * 1000; // 10 minutes timeout threshold

    // 2. Auto-heal any stale zombie jobs stuck in 'processing' state
    let healedCount = 0;
    for (const j of allJobs) {
      const payload = j.payload || {};
      if (payload.status === 'processing') {
        const updatedAt = j.updated_at ? new Date(j.updated_at).getTime() : 0;
        if (now.getTime() - updatedAt > STALE_ZOMBIE_MS) {
          console.warn(`[Cron] Auto-healing stale zombie job ${j.id} (stuck for ${Math.round((now.getTime() - updatedAt) / 60000)}m)`);
          payload.status = 'scheduled';
          await db.update('content_jobs', j.id, {
            stage: 'research',
            updated_at: now.toISOString(),
            payload,
          });
          j.payload = payload;
          j.stage = 'research';
          healedCount++;
        }
      }
    }

    // 3. Filter and sort pending/scheduled jobs by scheduled_for ascending
    const pendingJobs = allJobs
      .filter((j: any) => {
        if (targetJobId) return j.id === targetJobId;
        const payload = j.payload || {};
        const status = payload.status || 'scheduled';
        if (status !== 'scheduled') return false;

        if (force) return true;
        if (!payload.scheduled_for) return true;
        const scheduledTime = new Date(payload.scheduled_for);
        return scheduledTime <= now;
      })
      .sort((a: any, b: any) => {
        const timeA = a.payload?.scheduled_for ? new Date(a.payload.scheduled_for).getTime() : 0;
        const timeB = b.payload?.scheduled_for ? new Date(b.payload.scheduled_for).getTime() : 0;
        return timeA - timeB;
      });

    if (pendingJobs.length === 0) {
      return NextResponse.json({
        message: 'No pending scheduled jobs to execute at this time',
        time: now.toISOString(),
        healed_zombies: healedCount,
        total_queued: allJobs.filter((j: any) => j.payload?.status === 'scheduled').length,
      });
    }

    const results = [];
    let aiGenerationCount = 0;
    // Allow max 1 heavy AI generation per invocation to avoid Cloudflare 100s timeout
    const maxAiRuns = targetJobId ? 1 : Math.max(1, Math.min(limitParam, 1));
    // For fast-path planned posts, allow activating up to 10 in a batch
    const maxFastActivations = 10;
    let fastActivationCount = 0;

    for (const job of pendingJobs) {
      const payload = job.payload || {};

      // ── CHECK FAST-PATH: Does this job reference a pre-authored post? ──
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

      // If pre-authored post exists and not yet published, activate it immediately
      if (plannedPost && plannedPost.status !== 'published') {
        if (fastActivationCount >= maxFastActivations) continue;
        console.log(`[Cron] Fast-activating pre-authored post "${plannedPost.title}" for job ${job.id}`);
        const nowIso = new Date().toISOString();

        await db.update('posts', plannedPost.id, {
          status: 'published',
          published_at: nowIso,
          updated_at: nowIso,
        });

        await db.update('content_jobs', job.id, {
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

        results.push({
          job_id: job.id,
          topic: payload.topic || plannedPost.title,
          slug: plannedPost.slug,
          mode: 'fast_activation',
          status: 'success',
        });
        fastActivationCount++;
        continue;
      }

      // ── HEAVY AI GENERATION PATH ──
      // If we already completed our quota of AI generations this invocation, skip remaining AI jobs for next run
      if (aiGenerationCount >= maxAiRuns) {
        continue;
      }

      console.log(`[Cron] Starting multi-stage AI generation for job ${job.id}: "${payload.topic}"`);

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

        const nowIso = new Date().toISOString();
        // Mark as done
        await db.update('content_jobs', job.id, {
          stage: 'done',
          updated_at: nowIso,
          payload: { ...payload, status: 'published' },
          result: {
            post_id: genResult.post.id,
            slug: genResult.post.slug,
            word_count: genResult.wordCount,
            item_count: genResult.itemCount,
            hero_image: genResult.heroImageUrl,
            published_at: nowIso,
          },
        });

        results.push({
          job_id: job.id,
          topic: payload.topic,
          slug: genResult.post.slug,
          word_count: genResult.wordCount,
          items: genResult.itemCount,
          mode: 'ai_generation',
          status: 'success',
        });
        aiGenerationCount++;
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
          mode: 'ai_generation',
          status: 'error',
          error: errorMsg,
        });
        aiGenerationCount++;
      }
    }

    // Execute automated Pinterest FIFO Pinning (1 post per cron run)
    let pinterestPinResult = null;
    try {
      const { pinNextOldestPost } = await import('@/lib/social/pinterest');
      pinterestPinResult = await pinNextOldestPost();
    } catch (pinErr: any) {
      console.warn('[Cron] Pinterest pinning error:', pinErr?.message || pinErr);
      pinterestPinResult = { success: false, error: pinErr?.message || String(pinErr) };
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      healed_zombies: healedCount,
      results,
      pinterest: pinterestPinResult,
      remaining_queued: pendingJobs.length - results.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[Cron] Cron handler exception:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
