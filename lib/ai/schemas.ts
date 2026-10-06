import { z } from 'zod';

export const GiftItemSchema = z.object({
  heading: z.string().min(3, 'Heading must be at least 3 characters'),
  image: z.string().url().optional(),
  url: z.string().optional(),
  merchant: z.string().default('Amazon España'),
  price: z.string().default('29,99 €'),
  description_html: z.string().min(10, 'Description must be at least 10 characters'),
  pros: z.array(z.string()).default([]),
  button_label: z.string().default('Ver en Tienda'),
});

export const FaqItemSchema = z.object({
  q: z.string().min(5, 'Question must be at least 5 characters'),
  a: z.string().min(10, 'Answer must be at least 10 characters'),
});

export const InternalLinkCandidateSchema = z.object({
  anchor_text: z.string().min(2),
  target_url: z.string().min(1),
  rel: z.string().optional(),
});

export const GeneratedPostSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters'),
  slug: z.string().min(3, 'Slug is required'),
  excerpt: z.string().min(20, 'Excerpt must be at least 20 characters'),
  intro_html: z.string().min(30, 'Intro HTML is required'),
  content_html: z.string().min(30, 'Content HTML is required'),
  items: z.array(GiftItemSchema).min(3, 'Must contain at least 3 gift recommendations'),
  faqs: z.array(FaqItemSchema).min(2, 'Must contain at least 2 FAQs'),
  internal_links: z.array(InternalLinkCandidateSchema).default([]),
  seo_title: z.string().max(80, 'SEO title should be under 80 characters'),
  seo_description: z.string().max(180, 'SEO description should be under 180 characters'),
  focus_keyword: z.string().min(2),
  hero_image: z.string().url(),
  hero_alt: z.string().min(3),
  suggested_category_slug: z.string().optional(),
});

export const AiConfigSchema = z.object({
  provider: z.enum(['mock', 'gemini', 'openai', 'anthropic']).default('mock'),
  model: z.string().default('mock-v1'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().positive().default(4096),
  maxRetries: z.number().int().min(0).max(5).default(3),
});

export type ValidatedGeneratedPost = z.infer<typeof GeneratedPostSchema>;
