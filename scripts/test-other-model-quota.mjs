import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

async function main() {
  const candidateModels = [
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-2.5-flash'
  ];

  for (const m of candidateModels) {
    try {
      const res = await ai.models.generateContent({
        model: m,
        contents: 'Hola, di OK si funcionas.',
      });
      console.log(`✅ Model ${m} is WORKING:`, res.text.trim());
    } catch (e) {
      console.log(`❌ Model ${m}:`, e.message.substring(0, 100));
    }
  }
}

main().catch(console.error);
