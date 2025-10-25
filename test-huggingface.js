// Test Hugging Face API
const fetch = require('node-fetch');

async function testHuggingFace() {
  try {
    // Hugging Face Inference API - free tier
    const API_URL = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium";
    
    console.log('🔑 Testing Hugging Face API...');
    
    const response = await fetch(API_URL, {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        inputs: "Hello! Can you tell me about DeFi?",
        parameters: {
          max_length: 100,
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Hugging Face Response:');
    console.log(result);
    console.log('\n🎉 Hugging Face integration working!');
    
  } catch (error) {
    console.log('❌ Error testing Hugging Face:');
    console.error('Error message:', error.message);
    
    // Try alternative model
    console.log('\n💡 Trying alternative model...');
    try {
      const API_URL2 = "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill";
      
      const response2 = await fetch(API_URL2, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          inputs: "Hello! Can you tell me about DeFi?",
        })
      });

      const result2 = await response2.json();
      console.log('✅ Alternative model response:');
      console.log(result2);
      
    } catch (error2) {
      console.log('❌ Alternative model also failed:', error2.message);
    }
  }
}

testHuggingFace();
