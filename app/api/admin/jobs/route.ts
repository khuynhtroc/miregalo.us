import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { enqueueContentJob, processContentJob } from '@/lib/ai/job-queue';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  const { rows, total } = await db.find('content_jobs', {
    eq: status ? { status } : undefined,
    order: [{ field: 'created_at', asc: false }],
  });

  return NextResponse.json({ rows, total });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const topic = body.topic || body.keyword;
  if (!topic) {
    return NextResponse.json({ error: 'Topic or keyword is required' }, { status: 400 });
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

  // If autoProcess !== false, process the job immediately with mock provider
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
