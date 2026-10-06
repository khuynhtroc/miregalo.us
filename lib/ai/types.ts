import type { Post, ContentJob, PostType, GiftItem, FaqItem } from '@/lib/types';

export interface AiModelConfig {
  provider: 'mock' | 'gemini' | 'openai' | 'anthropic';
  model: string;
  temperature?: number;
  maxTokens?: number;
  maxRetries?: number;
}

export interface GeneratePostInput {
  topic: string;
  keyword?: string;
  targetPath?: string;
  postType?: PostType;
  cluster?: string;
  intent?: string;
  silo?: string;
  notes?: string;
}

export interface InternalLinkCandidate {
  anchor_text: string;
  target_url: string;
  rel?: string;
}

export interface GeneratePostOutput {
  title: string;
  slug: string;
  excerpt: string;
  intro_html: string;
  content_html: string;
  items: GiftItem[];
  faqs: FaqItem[];
  internal_links: InternalLinkCandidate[];
  seo_title: string;
  seo_description: string;
  focus_keyword: string;
  hero_image: string;
  hero_alt: string;
  suggested_category_slug?: string;
}

export interface JobExecutionLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  stage: 'queued' | 'research' | 'generation' | 'validation' | 'storage' | 'completion' | 'retry';
  message: string;
  metadata?: Record<string, unknown>;
}

export interface JobResult {
  job: ContentJob;
  generatedPost?: Post;
  logs: JobExecutionLog[];
  success: boolean;
  error?: string;
}

export interface AiProvider {
  readonly name: string;
  readonly isMock: boolean;
  generateArticle(input: GeneratePostInput, config?: Partial<AiModelConfig>): Promise<GeneratePostOutput>;
}
