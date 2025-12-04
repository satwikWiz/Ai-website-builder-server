import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

console.log('🔍 Testing Gemini API Configuration...');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (!GEMINI_API_KEY) {
  console.error('❌ ERROR: GEMINI_API_KEY is not set!');
  console.error('');
  console.error('Please create a .env file in the server/ directory with:');
  console.error('  GEMINI_API_KEY=your_api_key_here');
  console.error('');
  console.error('Get your API key from: https://makersuite.google.com/app/apikey');
  process.exit(1);
}

console.log('✅ API Key found');
console.log(`   Key length: ${GEMINI_API_KEY.length} characters`);
console.log(`   Key prefix: ${GEMINI_API_KEY.substring(0, 10)}...`);
console.log('');

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function testGemini() {
  try {
    console.log('🚀 Testing Gemini API connection...');
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    console.log('✅ Model initialized: gemini-2.5-flash');
    
    console.log('📤 Sending test request...');
    const result = await model.generateContent('Say hello in one word');
    const response = result.response;
    const text = response.text();
    
    console.log('');
    console.log('✅ SUCCESS! Gemini API is working!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Response:', text);
    console.log('');
    console.log('🎉 Your API key is valid and working!');
  } catch (error) {
    console.log('');
    console.error('❌ ERROR: Gemini API test failed!');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.code || 'N/A');
    
    if (error.message?.includes('API_KEY') || error.message?.includes('API key') || error.message?.includes('expired')) {
      console.error('');
      console.error('⚠️  This looks like an API key issue.');
      console.error('   - Make sure your API key is correct');
      console.error('   - Check that the key has proper permissions');
      console.error('   - Verify the key is active in Google AI Studio');
      console.error('   - Get a new key from: https://makersuite.google.com/app/apikey');
    } else if (error.message?.includes('404') || error.message?.includes('not found')) {
      console.error('');
      console.error('⚠️  Model not found (404).');
      console.error('   - gemini-2.5-flash might not be available for your API key');
      console.error('   - Check available models in Google AI Studio');
    } else if (error.message?.includes('quota') || error.message?.includes('Quota')) {
      console.error('');
      console.error('⚠️  You may have exceeded your API quota.');
      console.error('   - Check your usage limits in Google AI Studio');
    } else if (error.message?.includes('permission') || error.message?.includes('Permission')) {
      console.error('');
      console.error('⚠️  Permission issue detected.');
      console.error('   - Check API key permissions');
    }
    
    console.error('');
    console.error('Full error details:');
    console.error(error);
    process.exit(1);
  }
}

testGemini();

