import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { enqueueContentJob, processContentJob } from '@/lib/ai/job-queue';
import { generateMultiStageArticle } from '@/lib/ai/multi-stage-generator';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  const { rows, total } = await db.find('content_jobs', {
    order: [{ field: 'created_at', asc: true }],
    limit: 500,
  });

  const normalizedRows = (rows || []).map((r: any) => {
    const payload = r.payload || {};
    return {
      ...r,
      topic: r.topic || payload.topic || r.keyword_id || 'Untitled',
      target_path: r.target_path || payload.target_path || '',
      status: r.status || payload.status || (r.stage === 'done' ? 'completed' : r.stage === 'error' ? 'failed' : 'queued'),
      model: r.model || payload.model || 'gemini-2.5-flash',
      scheduled_for: payload.scheduled_for || null,
      cluster: payload.cluster || '',
      order_index: payload.order_index || 0,
      min_words: payload.min_words || 5000,
      attempts: r.attempts || 0,
      duration_ms: r.duration_ms || 0,
    };
  });

  const filtered = status
    ? normalizedRows.filter((j: any) => j.status === status)
    : normalizedRows;

  return NextResponse.json({ rows: filtered, total: filtered.length });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const topic = body.topic || body.keyword;
  if (!topic) {
    return NextResponse.json({ error: 'Topic or keyword is required' }, { status: 400 });
  }

  // If multi-stage 5000-word generation requested
  if (body.multiStage) {
    try {
      const result = await generateMultiStageArticle({
        topic,
        cluster: body.cluster || 'General',
        silo: body.silo || 'RECIPIENT',
        target_slug: body.targetPath || body.slug,
        keyword_id: body.keyword_id,
        min_words: body.min_words || 5000,
        affiliate_tag: body.affiliate_tag || 'miregalo26-20',
        publish: body.publish ?? true,
      });
      return NextResponse.json({ success: true, result }, { status: 201 });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }

  const job = await enqueueContentJob(
    {
      topic,
      keyword: body.keyword,
      targetPath: body.targetPath || body.slug,
      cluster: body.cluster || body.hub,
    },
    {
      model: body.model || 'mock-v1',
      maxRetries: body.maxRetries || 3,
    }
  );

  if (body.autoProcess !== false) {
    const result = await processContentJob(job.id);
    return NextResponse.json(
      {
        job: result.job,
        generatedPost: result.generatedPost,
        logs: result.logs,
        success: result.success,
      },
      { status: 201 }
    );
  }

  return NextResponse.json({ job }, { status: 201 });
}
