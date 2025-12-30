import { Injectable, Logger } from '@nestjs/common';
import { Ollama } from 'ollama';

@Injectable()
export class OllamaService {
  private ollama: Ollama;
  private readonly model: string;
  private readonly logger = new Logger(OllamaService.name);
  private isConnected = false;

  constructor() {
    const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
    const ollamaModel = process.env.OLLAMA_MODEL || 'qwen2.5:0.5b';
    
    this.logger.log(`Initializing Ollama: host=${ollamaHost}, model=${ollamaModel}`);
    this.ollama = new Ollama({ host: ollamaHost });
    this.model = ollamaModel;
    
    // Test connection on startup
    this.testConnection().then(connected => {
      this.isConnected = connected;
      if (!connected) {
        this.logger.error(`Failed to connect to Ollama at ${ollamaHost}`);
        this.logger.error('Please ensure Ollama is running and accessible.');
        this.logger.error('Set OLLAMA_HOST environment variable to your Ollama server URL.');
      } else {
        this.logger.log(`Successfully connected to Ollama at ${ollamaHost}`);
      }
    });
  }

  private async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
      throw new Error(
        `Ollama is not available at ${ollamaHost}. ` +
        `Please ensure Ollama is running and accessible. ` +
        `Set OLLAMA_HOST environment variable to configure the connection.`
      );
    }
  }

  async generateFlashcards(text: string, topic: string, count: number = 30): Promise<any[]> {
    await this.ensureConnection();
    
    this.logger.log(`Generating ${count} flashcards for topic: ${topic}`);
    this.logger.log(`Content length: ${text.length} characters`);
    
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

    this.logger.log(`Calling Ollama with model: ${this.model}`);
    const response = await this.ollama.generate({
      model: this.model,
      prompt,
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 2000,
      },
    });

    this.logger.log(`Received response from Ollama`);
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
    
    this.logger.log(`Successfully generated ${validCards.length} valid cards`);
    return validCards;
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

  async generateAdaptiveCards(
    topic: string,
    contextCards: string,
    cardsPerTopic: number,
  ): Promise<any[]> {
    await this.ensureConnection();
    
    const prompt = `You are creating ${cardsPerTopic} NEW flashcards about "${topic}" for a student who found this difficult.

CONTEXT - Student struggled with these cards:
${contextCards.substring(0, 6000)}

INSTRUCTIONS:
1. Create ${cardsPerTopic} COMPLETELY NEW questions about "${topic}"
2. Questions must be DIFFERENT from the context cards above
3. Focus on reinforcing understanding of "${topic}"
4. Make questions clear and answers complete
5. Each card should test a unique aspect of "${topic}"

Return ONLY a valid JSON array:
[
  {
    "front": "New unique question about ${topic}?",
    "back": "Clear answer",
    "tags": ["${topic}"]
  }
]

Generate exactly ${cardsPerTopic} NEW flashcards. Return ONLY the JSON array.`;

    const response = await this.ollama.generate({
      model: this.model,
      prompt,
      stream: false,
      options: {
        temperature: 0.8,
        num_predict: 1500,
      },
    });

    const content = response.response.trim();
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Ollama did not return valid JSON');
    }

    const genCards = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(genCards)) {
      throw new Error('Ollama response is not an array');
    }

    return genCards
      .filter((gc) => gc.front && gc.back)
      .map((gc) => ({
        front: gc.front.trim(),
        back: gc.back.trim(),
        tags: gc.tags || [topic],
      }));
  }

  async generateLanguageFlashcards(params: {
    text: string;
    topic: string;
    languageCode: string;
    cardTypes?: string[];
    level?: string;
    count?: number;
  }): Promise<any[]> {
    await this.ensureConnection();
    const { text, topic, languageCode, cardTypes = ['vocab','sentence','cloze','grammar'], level = 'beginner', count = 40 } = params;

    const typeInstructions = `
VOCABULARY CARDS:
- type: "vocab"
- front: the target language word alone (no translation)
- back: concise translation (English), part of speech, one example sentence
- fields: { "word": string, "translation": string, "partOfSpeech": string, "example": string }

SENTENCE TRANSLATION CARDS:
- type: "sentence"
- front: "Translate: <sentence in ${languageCode}>"
- back: translation in English; keep punctuation
- fields: { "sentence": string, "translation": string }

CLOZE (FILL-IN-THE-BLANK) CARDS:
- type: "cloze"
- front: sentence with one blank (use "___")
- back: the missing word only
- fields: { "sentence": string, "answer": string, "hint": string }

GRAMMAR PATTERN CARDS:
- type: "grammar"
- front: short prompt explaining the pattern and asking to identify/apply (no long paragraphs)
- back: rule explanation and the correct form
- fields: { "rule": string, "pattern": string, "example": string, "explanation": string }
`;

    const prompt = `You are a language tutor creating flashcards from a book excerpt.

TARGET LANGUAGE: ${languageCode}
LEVEL: ${level}
TOPIC: ${topic}
ALLOWED CARD TYPES: ${cardTypes.join(', ')}
TOTAL CARDS: ${count}

SOURCE TEXT (excerpt):
${text.substring(0, 8000)}

INSTRUCTIONS:
1) Extract useful items (words, collocations, sentences, grammar patterns) from the SOURCE TEXT only
2) Make cards concise and suitable for spaced repetition
3) Use the TARGET LANGUAGE exactly for the front when relevant
4) Avoid duplicates; ensure variety across requested card types
5) Prefer high-frequency and context-relevant items
6) Keep answers accurate and short

CARD FORMATS:
${typeInstructions}

Return ONLY a valid JSON array of cards. Each object MUST have keys: {"type","front","back","fields"}.
Generate exactly ${count} cards in total.`;

    const response = await this.ollama.generate({ model: this.model, prompt, stream: false, options: { temperature: 0.7, num_predict: 2500 } });
    const content = response.response.trim();
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const jsonStr = jsonMatch ? jsonMatch[0] : content;
    const cards = JSON.parse(jsonStr);

    if (!Array.isArray(cards)) throw new Error('Language cards response is not an array');

    return cards
      .filter((c) => c.type && c.front && c.back && typeof c.fields === 'object')
      .map((c) => ({
        type: String(c.type).toLowerCase(),
        front: String(c.front).trim(),
        back: String(c.back).trim(),
        fields: c.fields || {},
        languageCode,
        tags: ["language", languageCode, topic].filter(Boolean),
      }));
  }
  async getStatus(): Promise<{ connected: boolean; host: string; model: string; message: string }> {
    const host = process.env.OLLAMA_HOST || 'http://localhost:11434';
    const message = this.isConnected 
      ? `✅ Connected to Ollama at ${host}` 
      : `❌ Failed to connect to Ollama at ${host}`;
    
    return {
      connected: this.isConnected,
      host,
      model: this.model,
      message,
    };
  }
}
