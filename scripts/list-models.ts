import { VertexAI } from '@google-cloud/vertexai';
import { config } from '../src/config';

async function listModels() {
  const locations = ['asia-southeast1', 'us-central1', 'global'];
  
  const candidates = [
    'gemini-3-flash-preview',
    'gemini-2.5-flash',
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash',
  ];

  console.log('\nTesting model availability across locations...');

  for (const location of locations) {
      console.log(`\n--- Checking Location: ${location} ---`);
      const vertexAI = new VertexAI({
        project: config.google.projectId,
        location: location,
      });

      for (const modelName of candidates) {
        try {
            // Note: For 'global' location, some SDK versions might behave differently 
            // or require specific endpoint overrides, but usually just setting location works.
            const model = vertexAI.preview.getGenerativeModel({ model: modelName });
            const resp = await model.generateContent('Hello');
            console.log(`[PASS] ${modelName} is available in ${location}.`);
        } catch (err: any) {
             // Simplify error message for log
            let msg = err.message.split('\n')[0];
            if (msg.includes('404')) msg = '404 Not Found';
            console.log(`[FAIL] ${modelName} in ${location}: ${msg}`);
        }
      }
  }
}

listModels().catch(console.error);
