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
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Hola, di ok',
    });
    console.log('gemini-2.5-flash:', res.text);
  } catch (e) {
    console.log('gemini-2.5-flash err:', e.message);
  }

  try {
    const pager = await ai.models.list();
    console.log('Models:');
    for await (const m of pager) {
      if (m.name.includes('flash') || m.name.includes('pro')) {
        console.log(' - ', m.name);
      }
    }
  } catch (err) {
    console.error('List models error:', err.message);
  }
}

main().catch(console.error);
