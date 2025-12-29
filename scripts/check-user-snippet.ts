const {VertexAI} = require('@google-cloud/vertexai');
require('dotenv').config();

async function checkPreview() {
  const vertex_ai = new VertexAI({
    project: process.env.GOOGLE_PROJECT_ID, 
    location: 'us-central1'
  });
  
  const models = ['gemini-3-flash-preview', 'gemini-3-pro-preview'];

  for (const modelName of models) {
    console.log(`Checking ${modelName} in us-central1...`);
    try {
      const generativeModel = vertex_ai.preview.getGenerativeModel({
        model: modelName,
      });
      const result = await generativeModel.generateContent({
        contents: [{role: 'user', parts: [{text: 'Hello'}]}],
      });
      console.log(`[SUCCESS] ${modelName} in us-central1 worked!`);
      return;
    } catch (e) {
      console.log(`[FAIL] ${modelName} in us-central1 failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const vertex_ai_global = new VertexAI({
    project: process.env.GOOGLE_PROJECT_ID, 
    location: 'global'
  });

  for (const modelName of models) {
    console.log(`Checking ${modelName} in global...`);
    try {
      const generativeModel = vertex_ai_global.preview.getGenerativeModel({
        model: modelName,
      });
      const result = await generativeModel.generateContent({
        contents: [{role: 'user', parts: [{text: 'Hello'}]}],
      });
      console.log(`[SUCCESS] ${modelName} in global worked!`);
      return;
    } catch (e) {
      console.log(`[FAIL] ${modelName} in global failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}

checkPreview();