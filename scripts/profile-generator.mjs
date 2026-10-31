import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/GEMINI_API_KEY=([^\r\n]+)/);
const apiKey = match ? match[1].trim() : '';

const ai = new GoogleGenAI({ apiKey });

async function profile() {
  console.log('--- Profiling AI Article Generation Components ---');
  
  // 1. Stage 1 call
  console.log('[1] Testing Stage 1 (Outline & Plan)...');
  let t0 = Date.now();
  try {
    const s1 = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: 'Genera un JSON con "title" y lista "items_plan" con 12 productos para regalos de última hora para papá.',
      config: { responseMimeType: 'application/json' },
    });
    console.log(`Stage 1 finished in ${Date.now() - t0}ms. Length: ${s1.text?.length}`);
  } catch (e) {
    console.log(`Stage 1 failed in ${Date.now() - t0}ms: ${e.message}`);
  }

  // 2. Stage 2 (Reviews)
  console.log('[2] Testing Stage 2 (12 detailed reviews)...');
  t0 = Date.now();
  try {
    const s2 = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: 'Redacta una reseña de 3 párrafos en HTML y pros/cons para 12 productos de regalo en JSON.',
      config: { responseMimeType: 'application/json' },
    });
    console.log(`Stage 2 finished in ${Date.now() - t0}ms. Length: ${s2.text?.length}`);
  } catch (e) {
    console.log(`Stage 2 failed in ${Date.now() - t0}ms: ${e.message}`);
  }

  // 3. Imagen 3 Image Generation
  console.log('[3] Testing Imagen 3 Image Generation...');
  t0 = Date.now();
  try {
    const img = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: 'Professional editorial photography for an elegant gift guide article titled "regalos para papa". Luxurious wrapped present box.',
      config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '16:9' },
    });
    console.log(`Imagen finished in ${Date.now() - t0}ms. Success: ${!!img.generatedImages?.length}`);
  } catch (e) {
    console.log(`Imagen failed in ${Date.now() - t0}ms: ${e.message}`);
  }
}

profile().catch(console.error);
