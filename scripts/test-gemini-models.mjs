import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/GEMINI_API_KEY=([^\r\n]+)/);
const apiKey = match ? match[1].trim() : '';

const ai = new GoogleGenAI({ apiKey });

async function testModel(modelName) {
  const start = Date.now();
  try {
    const res = await ai.models.generateContent({
      model: modelName,
      contents: 'Say "hello" in Spanish',
    });
    console.log(`Model ${modelName}: SUCCESS in ${Date.now() - start}ms -> "${res.text?.trim()}"`);
  } catch (err) {
    console.log(`Model ${modelName}: FAILED in ${Date.now() - start}ms -> ${err.message}`);
  }
}

async function main() {
  await testModel('gemini-2.5-flash');
  await testModel('gemini-2.0-flash');
  await testModel('gemini-1.5-flash');
  await testModel('gemini-3.8-flash');
}

main().catch(console.error);
