import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyDfn6IbiKPH3FxrHElgvxa6NYugCDHQrhc');

async function listModels() {
  try {
    console.log('Listing available models...');
    const models = await genAI.listModels();
    
    console.log('\nAvailable models:');
    for await (const model of models) {
      console.log(`- ${model.name}`);
      if (model.supportedGenerationMethods?.includes('generateContent')) {
        console.log('  ✅ Supports generateContent');
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Trying alternative approach...');
    
    // Try common model names
    const commonModels = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'models/gemini-1.5-flash', 'models/gemini-1.5-pro'];
    
    for (const modelName of commonModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('test');
        console.log(`✅ ${modelName} works!`);
        break;
      } catch (e) {
        console.log(`❌ ${modelName} failed: ${e.message}`);
      }
    }
  }
}

listModels();

