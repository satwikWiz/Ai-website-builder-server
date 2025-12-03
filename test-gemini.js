import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyDfn6IbiKPH3FxrHElgvxa6NYugCDHQrhc');

async function testGemini() {
  try {
    console.log('Testing Gemini API...');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const result = await model.generateContent('Say hello in one word');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini API is working!');
    console.log('Response:', text);
  } catch (error) {
    console.error('❌ Gemini API Error:');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Details:', error);
  }
}

testGemini();

