import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const candidates = [
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-2.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-2.5-pro',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
  'gemini-3.8-flash'
];

async function checkAll() {
  for (const m of candidates) {
    const t0 = Date.now();
    try {
      const res = await ai.models.generateContent({ model: m, contents: 'hola' });
      console.log(`[OK] ${m} responded in ${Date.now() - t0}ms: ${res.text.trim().slice(0, 30)}`);
    } catch (e) {
      console.log(`[FAIL] ${m} in ${Date.now() - t0}ms: ${e.status || e.message?.slice(0, 60)}`);
    }
  }
}

checkAll();
