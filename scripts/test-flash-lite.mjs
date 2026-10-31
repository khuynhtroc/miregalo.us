import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/GEMINI_API_KEY=([^\r\n]+)/);
const apiKey = match ? match[1].trim() : '';
const ai = new GoogleGenAI({ apiKey });

async function run() {
  const start = Date.now();
  const res = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite',
    contents: 'Genera un JSON con title y lista items_plan con 12 productos para regalos de última hora para papá.',
    config: { responseMimeType: 'application/json' },
  });
  console.log(`gemini-3.1-flash-lite SUCCESS in ${Date.now() - start}ms! Output:`);
  console.log(res.text?.slice(0, 300));
}

run().catch(console.error);
