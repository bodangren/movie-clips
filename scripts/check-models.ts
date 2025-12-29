import { VertexAI } from '@google-cloud/vertexai';
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
  const vertexAI = new VertexAI({
    project: process.env.GOOGLE_PROJECT_ID || '',
    location: 'global',
  });
  
  const candidates = [
    'gemini-3-flash-preview',
    'gemini-3-pro-preview',
    'gemini-3-flash',
    'gemini-3-pro',
  ];

  console.log(`Checking exact strings for Project: ${process.env.GOOGLE_PROJECT_ID} in ${process.env.GOOGLE_LOCATION}`);

  for (const modelId of candidates) {
    try {
        const model = vertexAI.getGenerativeModel({ model: modelId });
        await model.generateContent("Hello");
        console.log(`[SUCCESS] ${modelId} is AVAILABLE.`);
    } catch (e: any) {
        console.log(`[FAIL] ${modelId} - Error: ${e.message.substring(0, 100)}`);
    }
  }
}

listModels();
