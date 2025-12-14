import { Injectable } from '@nestjs/common';
import { Ollama } from 'ollama';

@Injectable()
export class OllamaService {
  private ollama: Ollama;
  private readonly model = 'qwen2.5:0.5b'; // User's installed model

  constructor() {
    this.ollama = new Ollama({ host: 'http://localhost:11434' });
  }

  async generateFlashcards(text: string, topic: string, count: number = 30): Promise<any[]> {
    console.log(`[Ollama Service] Generating ${count} flashcards for topic: ${topic}`);
    console.log(`[Ollama Service] Content length: ${text.length} characters`);
    
    const prompt = `You are an expert educator creating flashcards for students. 

Given the following content about "${topic}", generate ${count} high-quality flashcards.

CONTENT:
${text.substring(0, 8000)}

INSTRUCTIONS:
1. Extract the most important concepts, facts, and relationships
2. Create clear, concise questions that test understanding
3. Provide accurate, complete answers
4. Focus on key terms, definitions, processes, and relationships
5. Make questions suitable for spaced repetition study

Return ONLY a valid JSON array in this exact format:
[
  {
    "front": "Question text here?",
    "back": "Answer text here",
    "tags": ["concept", "keyword"]
  }
]

Generate exactly ${count} flashcards. Return ONLY the JSON array, no other text.`;

    try {
      console.log(`[Ollama Service] Calling Ollama with model: ${this.model}`);
      const response = await this.ollama.generate({
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 2000,
        },
      });

      console.log(`[Ollama Service] Received response from Ollama`);
      // Parse the response
      const content = response.response.trim();
      
      // Try to extract JSON from response
      let jsonStr = content;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const cards = JSON.parse(jsonStr);
      
      if (!Array.isArray(cards)) {
        throw new Error('Response is not an array');
      }

      // Validate and clean cards
      const validCards = cards
        .filter((card) => card.front && card.back)
        .map((card) => ({
          front: card.front.trim(),
          back: card.back.trim(),
          tags: card.tags || [],
          type: 'basic',
        }));
      
      console.log(`[Ollama Service] Successfully generated ${validCards.length} valid cards`);
      return validCards;
    } catch (error) {
      console.error('[Ollama Service] Generation error:', error);
      console.log('[Ollama Service] Using fallback card generation...');
      
      // Fallback: create basic cards from sentences
      return this.createFallbackCards(text, count);
    }
  }

  async extractTopics(text: string): Promise<string[]> {
    const prompt = `Analyze the following text and extract the 5 most important topics or themes.

TEXT:
${text.substring(0, 4000)}

Return ONLY a JSON array of topic strings, like: ["Topic 1", "Topic 2", "Topic 3"]

Topics:`;

    try {
      const response = await this.ollama.generate({
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: 0.5,
          num_predict: 200,
        },
      });

      const content = response.response.trim();
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const topics = JSON.parse(jsonMatch[0]);
        return topics.slice(0, 5);
      }

      // Fallback: simple keyword extraction
      return this.extractKeywords(text);
    } catch (error) {
      console.error('Topic extraction error:', error);
      return this.extractKeywords(text);
    }
  }

  async summarizeText(text: string, maxLength: number = 500): Promise<string> {
    const prompt = `Summarize the following text in ${maxLength} characters or less. Focus on the key concepts and main ideas.

TEXT:
${text.substring(0, 6000)}

SUMMARY:`;

    try {
      const response = await this.ollama.generate({
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 300,
        },
      });

      return response.response.trim().substring(0, maxLength);
    } catch (error) {
      console.error('Summarization error:', error);
      return text.substring(0, maxLength) + '...';
    }
  }

  private createFallbackCards(text: string, count: number): any[] {
    const sentences = text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20 && s.length < 200);

    const cards = [];
    for (let i = 0; i < Math.min(count, sentences.length - 1); i++) {
      const sentence = sentences[i];
      const words = sentence.split(' ');
      
      if (words.length > 5) {
        // Create a fill-in-the-blank style card
        const blankIndex = Math.floor(words.length / 2);
        const answer = words[blankIndex];
        words[blankIndex] = '____';
        
        cards.push({
          front: words.join(' ') + '?',
          back: answer,
          type: 'basic',
        });
      }
    }

    return cards.slice(0, count);
  }

  private extractKeywords(text: string): string[] {
    // Simple frequency-based keyword extraction
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 4);

    const freq: Record<string, number> = {};
    words.forEach((w) => {
      freq[w] = (freq[w] || 0) + 1;
    });

    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map((e) => e[0]);
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.ollama.list();
      return true;
    } catch (error) {
      console.error('Ollama connection failed:', error);
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const models = await this.ollama.list();
      return models.models.map((m) => m.name);
    } catch (error) {
      console.error('Failed to get models:', error);
      return [];
    }
  }
}
