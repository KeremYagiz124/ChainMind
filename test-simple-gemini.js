// Simplified Gemini test without dotenv
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  try {
    // Use the API key from environment variable
    const apiKey = process.env.GEMINI_API_KEY || "your_gemini_api_key_here";
    
    console.log('🔑 Testing with direct API key...');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

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
    console.error('Error message:', error.message);
    console.error('Error details:', error);
    
    // Check specific error types
    if (error.message.includes('API_KEY_INVALID')) {
      console.log('\n💡 API key is invalid');
    } else if (error.message.includes('404')) {
      console.log('\n💡 Model not found, trying gemini-1.5-flash...');
      
      try {
        const genAI2 = new GoogleGenerativeAI(apiKey);
        const model2 = genAI2.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result2 = await model2.generateContent(prompt);
        const response2 = await result2.response;
        const text2 = response2.text();
        
        console.log('✅ Gemini Response (with gemini-1.5-flash):');
        console.log(text2);
        console.log('\n🎉 Gemini integration working with gemini-1.5-flash!');
      } catch (error2) {
        console.log('❌ gemini-1.5-flash also failed:', error2.message);
        
        // Try other models
        const models = ['gemini-1.5-pro', 'gemini-1.0-pro', 'text-bison-001'];
        for (const modelName of models) {
          try {
            console.log(`Trying model: ${modelName}`);
            const genAI3 = new GoogleGenerativeAI(apiKey);
            const model3 = genAI3.getGenerativeModel({ model: modelName });
            const result3 = await model3.generateContent(prompt);
            const response3 = await result3.response;
            const text3 = response3.text();
            
            console.log(`✅ Success with ${modelName}:`);
            console.log(text3);
            return;
          } catch (error3) {
            console.log(`❌ ${modelName} failed:`, error3.message);
          }
        }
      }
    }
  }
}

testGemini();
