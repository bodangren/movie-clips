const {GoogleGenAI} = require('@google/genai');

// Ensure these are set in your environment or passed explicitly
const GOOGLE_CLOUD_PROJECT = process.env.GOOGLE_PROJECT_ID || 'reading-advantage';
const GOOGLE_CLOUD_LOCATION = 'global'; // Trying global for V3

console.log(`Testing with Project: ${GOOGLE_CLOUD_PROJECT}, Location: ${GOOGLE_CLOUD_LOCATION}`);

async function testModel(modelName) {
  console.log(`\nTesting model: ${modelName}...`);
  try {
    const client = new GoogleGenAI({
      vertexai: true,
      project: GOOGLE_CLOUD_PROJECT,
      location: GOOGLE_CLOUD_LOCATION,
    });

    const response = await client.models.generateContent({
      model: modelName,
      contents: 'Hello, are you there?',
    });

    console.log(`[SUCCESS] Response from ${modelName}:`);
    console.log(response.text);
  } catch (error) {
    console.error(`[FAILURE] Error with ${modelName}:`);
    console.error(error.message);
  }
}

async function runTests() {
  await testModel('gemini-2.0-flash-exp'); 
  await testModel('gemini-3-flash-preview');
  await testModel('gemini-2.5-flash');
}

runTests();
