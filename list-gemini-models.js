// List available Gemini models
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: './backend/.env' });

async function listModels() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.log('❌ GEMINI_API_KEY not found');
      return;
    }

    console.log('🔍 Listing available Gemini models...');
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // List models
    const models = await genAI.listModels();
    
    console.log('✅ Available models:');
    models.forEach(model => {
      console.log(`- ${model.name}`);
      console.log(`  Display Name: ${model.displayName}`);
      console.log(`  Supported Methods: ${model.supportedGenerationMethods?.join(', ')}`);
      console.log('');
    });
    
  } catch (error) {
    console.log('❌ Error listing models:');
    console.error(error.message);
  }
}

listModels();
