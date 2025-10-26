require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY not found in your .env file.');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    console.log('Fetching available Gemini models...');
    // This is an undocumented way to list models, but it works with the SDK.
    const modelList = await genAI.getGenerativeModel({ model: "gemini-pro" }).listModels();
    
    console.log('--- Available Gemini Models for Chat ---');
    let foundModels = false;
    for await (const m of modelList) {
        if (m.supportedGenerationMethods.includes('generateContent')) {
            console.log(`- ${m.name} (Display Name: ${m.displayName})`);
            foundModels = true;
        }
    }

    if (!foundModels) {
        console.log('No generative models found for this API key.');
    }
    console.log('----------------------------------------');

  } catch (error) {
    console.error('Error fetching models:', error.message);
    if (error.message.includes('API key not valid')) {
        console.error('Hint: Please double-check your GEMINI_API_KEY in the .env file.');
    }
  }
}

listModels();
