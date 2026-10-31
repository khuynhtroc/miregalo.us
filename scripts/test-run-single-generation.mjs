import { generateMultiStageArticle } from '../lib/ai/multi-stage-generator.js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testGen() {
  console.log('Testing full multi-stage article generation for: "regalos de última hora para papá"...');
  const start = Date.now();
  const res = await generateMultiStageArticle({
    topic: 'regalos de última hora para papá',
    cluster: 'Papá',
    silo: 'RECIPIENT_URGENCY',
    target_slug: '/regalos/para-papa/ultima-hora/',
    min_words: 5000,
    affiliate_tag: 'miregalo26-20',
    publish: true,
  });
  console.log(`Generation completed in ${Date.now() - start}ms!`);
  console.log('Post Title:', res.post.title);
  console.log('Post Slug:', res.post.slug);
  console.log('Word Count:', res.wordCount);
  console.log('Items Count:', res.itemCount);
  console.log('Hero Image:', res.heroImageUrl);
}

testGen().catch(console.error);
