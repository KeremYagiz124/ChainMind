// Quick test script for Gemini API
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: './backend/.env' });

// Also check root .env file
require('dotenv').config();

async function testGemini() {
  try {
    // Check if API key is set
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('🔍 Checking API key...');
    console.log('API Key length:', apiKey ? apiKey.length : 'undefined');
    console.log('API Key starts with:', apiKey ? apiKey.substring(0, 10) + '...' : 'undefined');
    console.log('AI_PROVIDER:', process.env.AI_PROVIDER);
    
    if (!apiKey) {
      console.log('❌ GEMINI_API_KEY not found in environment variables');
      return;
    }
    
    // Fix AI_PROVIDER value - it should be "gemini", not "gemini-1.5-flash"
    if (process.env.AI_PROVIDER === 'gemini-1.5-flash') {
      console.log('⚠️  AI_PROVIDER should be "gemini", not "gemini-1.5-flash"');
      console.log('The model name goes in the code, not the provider name');
    }

    console.log('🔑 API Key found, testing Gemini...');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    // Try different model names
    let model;
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      console.log('Using model: gemini-pro');
    } catch (e) {
      try {
        model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        console.log('Using model: gemini-1.5-flash');
      } catch (e2) {
        model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
        console.log('Using model: gemini-1.5-pro');
      }
    }

    const prompt = "Hello! Can you tell me about DeFi in one sentence?";
    
    console.log('📤 Sending test message:', prompt);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini Response:');
    console.log(text);
    console.log('\n🎉 Gemini integration working successfully!');
    
  } catch (error) {
    console.log('❌ Error testing Gemini:');
    console.error('Full error:', error);
    console.error('Error message:', error.message);
    console.error('Error status:', error.status);
    
    if (error.message.includes('API_KEY_INVALID')) {
      console.log('\n💡 Tip: Check if your GEMINI_API_KEY is correct');
    } else if (error.message.includes('404')) {
      console.log('\n💡 Tip: Model name might be incorrect. Trying different model...');
    }
  }
}

testGemini();
