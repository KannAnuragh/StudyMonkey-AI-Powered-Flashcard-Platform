// Quick test script to verify Ollama is working
const { Ollama } = require('ollama');

async function testOllama() {
  console.log('Testing Ollama connection...');
  
  const ollama = new Ollama({ host: 'http://localhost:11434' });
  
  try {
    console.log('\n1. Testing simple generation...');
    const response = await ollama.generate({
      model: 'qwen2.5:0.5b',
      prompt: 'Say hello in one sentence',
      stream: false,
    });
    console.log('✅ Ollama responded:', response.response);
    
    console.log('\n2. Testing flashcard generation...');
    const cardResponse = await ollama.generate({
      model: 'qwen2.5:0.5b',
      prompt: `Generate 3 simple flashcards about mathematics in JSON format:
[{"front": "question", "back": "answer"}]

Return ONLY the JSON array, nothing else.`,
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 500,
      }
    });
    
    console.log('Raw response:', cardResponse.response);
    
    // Try to parse
    const jsonMatch = cardResponse.response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const cards = JSON.parse(jsonMatch[0]);
      console.log('✅ Generated cards:', JSON.stringify(cards, null, 2));
    } else {
      console.log('⚠️ Could not extract JSON from response');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testOllama();
