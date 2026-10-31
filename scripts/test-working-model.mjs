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
  for (const m of ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.5-flash']) {
    try {
      const res = await ai.models.generateContent({
        model: m,
        contents: 'Hola, escribe 1 frase en español para Halloween.',
      });
      console.log(`Model ${m}: SUCCESS ->`, res.text);
      return;
    } catch (err) {
      console.log(`Model ${m} failed:`, err.message);
    }
  }
}

main().catch(console.error);
