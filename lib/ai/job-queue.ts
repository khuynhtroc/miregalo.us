import { db } from '@/lib/db';
import type { ContentJob, Post } from '@/lib/types';
import type { GeneratePostInput, JobResult, JobExecutionLog, AiModelConfig } from './types';
import { getAiProvider } from './provider-factory';
import { withRetry } from './retry';

export async function enqueueContentJob(
  input: GeneratePostInput,
  config?: Partial<AiModelConfig>
): Promise<ContentJob> {
  const now = new Date().toISOString();
  const id = `job-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6)}`;
  const model = config?.model || 'mock-v1';

  const job = await db.insert('content_jobs', {
    id,
    topic: input.topic,
    keyword_id: input.keyword || null,
    target_path: input.targetPath || null,
    status: 'queued',
    model,
    prompt: `Generate gift guide for: ${input.topic} (Cluster: ${input.cluster || 'General'})`,
    generated_post_id: null,
    attempts: 0,
    max_attempts: config?.maxRetries ?? 3,
    retry_after: null,
    duration_ms: 0,
    log: JSON.stringify([
      {
        timestamp: now,
        level: 'info',
        stage: 'queued',
        message: `Job ${id} enqueued for topic "${input.topic}"`,
      },
    ] as JobExecutionLog[]),
    error: null,
    created_at: now,
    updated_at: now,
  });

  return job;
}

export async function processContentJob(jobId: string): Promise<JobResult> {
  const startTime = Date.now();
  const logs: JobExecutionLog[] = [];

  const addLog = (level: JobExecutionLog['level'], stage: JobExecutionLog['stage'], message: string, metadata?: Record<string, unknown>) => {
    logs.push({
      timestamp: new Date().toISOString(),
      level,
      stage,
      message,
      metadata,
    });
  };

  const job = await db.findOne('content_jobs', { id: jobId });
  if (!job) {
    throw new Error(`Job not found: ${jobId}`);
  }

  // Parse existing logs if present
  try {
    if (job.log) {
      const prev = JSON.parse(job.log);
      if (Array.isArray(prev)) logs.push(...prev);
    }
  } catch {}

  addLog('info', 'queued', `Starting processing for Job ${jobId}`);

  // Transition to researching
  await db.update('content_jobs', jobId, {
    status: 'researching',
    attempts: (job.attempts || 0) + 1,
    log: JSON.stringify(logs),
  });

  addLog('info', 'research', `Researching search intent and cluster taxonomy for "${job.topic}"`);

  const provider = getAiProvider(job.model.includes('gemini') ? 'gemini' : 'mock');
  addLog('info', 'generation', `Dispatching to AI provider [${provider.name}] (isMock: ${provider.isMock})`);

  let generatedPost: Post | undefined;
  let success = false;
  let errorMessage: string | undefined;

  try {
    const input: GeneratePostInput = {
      topic: job.topic,
      keyword: job.keyword_id || undefined,
      targetPath: job.target_path || undefined,
    };

    // Execute with retry
    const output = await withRetry(
      async (attempt) => {
        addLog('info', 'generation', `Generation attempt #${attempt}`);
        return await provider.generateArticle(input);
      },
      {
        maxRetries: job.max_attempts || 3,
        initialDelayMs: 300,
        onRetry: (err, attempt, delay) => {
          addLog('warn', 'retry', `Attempt #${attempt} failed: ${err instanceof Error ? err.message : String(err)}. Retrying in ${delay.toFixed(0)}ms...`);
        },
      }
    );

    addLog('info', 'validation', `Output successfully passed Zod schema validation. Generated ${output.items.length} items and ${output.faqs.length} FAQs`);

    // Save generated post into DB
    const now = new Date().toISOString();
    const postId = `post-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6)}`;

    generatedPost = await db.insert('posts', {
      id: postId,
      type: 'gift',
      slug: output.slug,
      title: output.title,
      excerpt: output.excerpt,
      intro_html: output.intro_html,
      content_html: output.content_html,
      items: output.items,
      faqs: output.faqs,
      hero_image: output.hero_image,
      hero_alt: output.hero_alt,
      primary_category_id: null,
      category_ids: [],
      author_id: null,
      status: 'published',
      featured: false,
      editor_pick: false,
      focus_keyword: output.focus_keyword,
      seo_title: output.seo_title,
      seo_description: output.seo_description,
      canonical_url: `/${output.slug}/`,
      robots: 'index, follow',
      og_image: output.hero_image,
      published_at: now,
      updated_at: now,
      created_at: now,
    });

    addLog('info', 'storage', `Created published post ${generatedPost.id} with canonical URL: /${generatedPost.slug}/`);

    // Register internal links
    for (const link of output.internal_links) {
      await db.insert('internal_links', {
        id: `il-${Date.now().toString().slice(-4)}-${Math.random().toString(36).slice(2, 5)}`,
        source_post_id: generatedPost.id,
        target_url: link.target_url,
        anchor_text: link.anchor_text,
        rel: link.rel || null,
        created_at: now,
      });
    }

    addLog('info', 'completion', `Job completed successfully in ${Date.now() - startTime}ms`);
    success = true;

    await db.update('content_jobs', jobId, {
      status: 'completed',
      generated_post_id: generatedPost.id,
      duration_ms: Date.now() - startTime,
      log: JSON.stringify(logs),
      error: null,
    });
  } catch (err: unknown) {
    errorMessage = err instanceof Error ? err.message : String(err);
    addLog('error', 'completion', `Job failed: ${errorMessage}`);

    await db.update('content_jobs', jobId, {
      status: 'failed',
      duration_ms: Date.now() - startTime,
      log: JSON.stringify(logs),
      error: errorMessage,
    });
  }

  const updatedJob = (await db.findOne('content_jobs', { id: jobId }))!;
  return {
    job: updatedJob,
    generatedPost,
    logs,
    success,
    error: errorMessage,
  };
}
