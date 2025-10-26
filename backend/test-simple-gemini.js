require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function listGenerativeModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('🔴 Error: GEMINI_API_KEY not found in your .env file.');
    return;
  }

  console.log('🚀 Fetching available models from Google AI...');

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    
    if (!data.models) {
      console.error('🔴 Could not parse models from response:', data);
      return;
    }

    const generativeModels = data.models.filter(m => 
      m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')
    );

    console.log('--- ✅ Available Generative Models ---');
    if (generativeModels.length > 0) {
      generativeModels.forEach(m => {
        console.log(`- Name: ${m.name}`);
        console.log(`  Display Name: ${m.displayName}`);
        console.log('---------------------------------');
      });
      console.log('\nSuggestion: Copy one of the model names (e.g., \'models/gemini-pro\') and set it as GEMINI_MODEL in your .env file.');
    } else {
      console.log('🔴 No models supporting `generateContent` found for this API key.');
      console.log('Hint: Ensure the "Generative Language API" is enabled in your Google Cloud project.');
    }

  } catch (error) {
    console.error('❌ Error fetching or listing models:', error.message);
    if (error.message.includes('API key not valid')) {
      console.error('Hint: Please double-check your GEMINI_API_KEY in the .env file.');
    }
  }
}

listGenerativeModels();
