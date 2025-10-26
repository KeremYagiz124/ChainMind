// Use built-in fetch in Node 18+
const fetch = globalThis.fetch || require('node-fetch');

async function testGemini() {
  const apiKey = 'AIzaSyD_MCJhUd5_2Kwq16uTpLrqbnmUuj80GZQ';
  
  try {
    console.log('Fetching available models...');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (data.models) {
      const geminiModels = data.models
        .filter(m => m.name.includes('gemini'))
        .map(m => m.name);
      
      console.log('Available Gemini models:');
      geminiModels.forEach(model => console.log(`- ${model}`));
      
      // Test first available model
      if (geminiModels.length > 0) {
        const testModel = geminiModels[0];
        console.log(`\nTesting model: ${testModel}`);
        
        const testResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Hello' }] }]
          })
        });
        
        if (testResponse.ok) {
          const result = await testResponse.json();
          console.log('✅ Test successful!');
          console.log('Response:', result.candidates[0].content.parts[0].text);
        } else {
          console.log('❌ Test failed:', testResponse.status, testResponse.statusText);
        }
      }
    } else {
      console.log('No models found or error:', data);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testGemini();
