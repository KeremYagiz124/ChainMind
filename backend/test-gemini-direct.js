require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiDirect() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('🔴 GEMINI_API_KEY not found');
    return;
  }

  console.log('🚀 Testing Gemini API with crypto analysis...');
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'models/gemini-2.5-flash' });
    
    const prompt = `You are ChainMind, a crypto analysis AI. A user asks: "Which coin should I buy?"
    
    Respond in English with crypto market analysis. Include:
    - Current market trends
    - Risk warnings
    - Educational guidance about DYOR (Do Your Own Research)
    
    Keep response under 200 words and professional.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini API Response:');
    console.log('=' .repeat(50));
    console.log(text);
    console.log('=' .repeat(50));
    
  } catch (error) {
    console.error('❌ Gemini API Error:', error.message);
    if (error.message.includes('404')) {
      console.error('Model not found. Trying alternative...');
      
      // Try alternative model
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'models/gemini-pro-latest' });
        const result = await model.generateContent('Test message');
        const response = await result.response;
        console.log('✅ Alternative model works:', response.text().substring(0, 100) + '...');
      } catch (altError) {
        console.error('❌ Alternative model also failed:', altError.message);
      }
    }
  }
}

testGeminiDirect();
