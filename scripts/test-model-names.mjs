import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach((line) => {
  const [k, ...v] = line.trim().split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
});

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

async function testModel(modelName) {
  try {
    const res = await ai.models.generateContent({
      model: modelName,
      contents: 'Hola, di ok',
    });
    console.log(`Model ${modelName}: SUCCESS ->`, res.text);
    return true;
  } catch (err) {
    console.log(`Model ${modelName}: FAILED ->`, err.message);
    return false;
  }
}

async function main() {
  for (const m of ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-flash', 'gemini-2.0-flash-lite']) {
    const ok = await testModel(m);
    if (ok) break;
  }
}

main().catch(console.error);
