import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { OllamaService } from './ollama.service';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { ImportStatus } from '@prisma/client';

@Processor('import-queue')
export class ImportProcessor {
  constructor(
    private prisma: PrismaService,
    private ollama: OllamaService,
  ) {}

  @Process('process-url')
  async handleUrlImport(job: Job) {
    const { jobId, url, rawText, fileBuffer, isPdf, userId, topic, deckId, filename } = job.data;

    console.log(`[Import Processor] Starting job ${jobId} for deck ${deckId}`);
    console.log(`[Import Processor] isPdf: ${isPdf}, filename: ${filename}`);

    await this.prisma.importJob.update({
      where: { id: jobId },
      data: { status: ImportStatus.processing },
    });

    try {
      let content: string;
      
      if (fileBuffer && isPdf) {
        console.log(`[Import Processor] Extracting PDF text...`);
        // Convert base64 string back to Buffer
        const buffer = typeof fileBuffer === 'string' 
          ? Buffer.from(fileBuffer, 'base64') 
          : Buffer.from(fileBuffer);
        content = await this.extractPdfText(buffer);
        console.log(`[Import Processor] Extracted ${content.length} characters from PDF`);
      } else if (rawText) {
        content = rawText;
      } else if (url) {
        console.log(`[Import Processor] Fetching URL: ${url}`);
        content = await this.fetchUrlText(url);
      } else {
        throw new Error('No content source provided');
      }

      const cardTopic = topic || url || filename || 'Imported deck';
      console.log(`[Import Processor] Generating cards for topic: ${cardTopic}`);
      const cards = await this.generateCards(cardTopic, content);
      console.log(`[Import Processor] Generated ${cards.length} cards`);

      // Persist preview
      await this.prisma.importJob.update({
        where: { id: jobId },
        data: {
          previewCards: cards,
          resultSummary: `Generated ${cards.length} cards`,
        },
      });

      // Create cards in DB
      console.log(`[Import Processor] Saving ${cards.length} cards to deck ${deckId}...`);
      for (const card of cards) {
        const created = await this.prisma.card.create({
          data: {
            deckId,
            type: card.type || 'basic',
            front: card.front,
            back: card.back,
            fields: card.fields || {},
            sourceUrl: url,
            sourceExcerpt: card.excerpt,
            confidenceScore: card.confidence || null,
          },
        });
        await this.prisma.schedulerState.create({
          data: {
            cardId: created.id,
            ef: 2.5,
            intervalDays: 0,
            repetitions: 0,
            nextDueTs: new Date(),
          },
        });
      }

      console.log(`[Import Processor] Successfully saved ${cards.length} cards. Job ${jobId} complete!`);

      await this.prisma.importJob.update({
        where: { id: jobId },
        data: {
          status: ImportStatus.completed,
          completedAt: new Date(),
        },
      });
    } catch (error) {
        const message = (error as Error)?.message || 'Unknown error';
        const stack = (error as Error)?.stack;
        console.error(`[Import Processor] Job ${jobId} failed:`, message, stack);

        await this.prisma.importJob.update({
          where: { id: jobId },
          data: {
            status: ImportStatus.failed,
            error: stack ? `${message}\n${stack}` : message,
          },
        });
    }
  }

  private async fetchUrlText(url: string) {
    const res = await axios.get(url, { 
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    });
    const $ = cheerio.load(res.data);
    $('script, style, nav, footer, header, .mw-editsection').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();
    return text.slice(0, 12000);
  }

  async extractPdfText(buffer: Buffer): Promise<string> {
    try {
      // Validate buffer
      if (!buffer || buffer.length === 0) {
        throw new Error('PDF buffer is empty or invalid');
      }

      console.log(`[Import Processor] pdf-parse reading buffer length: ${buffer.length} bytes`);
      
      // Check if buffer starts with PDF signature
      const pdfSignature = buffer.toString('utf8', 0, 5);
      console.log(`[Import Processor] PDF signature: ${pdfSignature}`);
      
      if (!pdfSignature.startsWith('%PDF')) {
        console.warn(`[Import Processor] Invalid PDF signature: ${pdfSignature}. Buffer might not be a PDF.`);
      }

      // Import pdf-parse (v1.1.1 exports a function directly)
      const pdfParse = require('pdf-parse');

      // First attempt with Uint8Array (safer for some PDF streams)
      const uint8 = new Uint8Array(buffer);
      try {
        console.log('[Import Processor] Attempting PDF parse with Uint8Array...');
        const data = await pdfParse(uint8);
        console.log(`[Import Processor] pdf-parse succeeded with Uint8Array. Extracted ${data.text?.length || 0} characters`);
        
        if (!data.text || data.text.trim().length === 0) {
          throw new Error('PDF parsed successfully but no text was extracted (might be an image-based PDF)');
        }
        
        return data.text;
      } catch (innerErr) {
        const errMsg = (innerErr as Error)?.message || 'Unknown error';
        console.warn('[Import Processor] pdf-parse Uint8Array failed, retrying with Buffer:', errMsg);
      }

      // Fallback: raw Buffer
      console.log('[Import Processor] Attempting PDF parse with Buffer...');
      const data = await pdfParse(buffer);
      console.log(`[Import Processor] pdf-parse succeeded with Buffer. Extracted ${data.text?.length || 0} characters`);
      
      if (!data.text || data.text.trim().length === 0) {
        throw new Error('PDF parsed successfully but no text was extracted (might be an image-based PDF or scanned document)');
      }
      
      return data.text;
    } catch (error) {
      const errorMessage = (error as Error)?.message || 'Unknown error';
      const errorStack = (error as Error)?.stack || '';
      
      console.error('[Import Processor] PDF extraction error (both attempts failed):', errorMessage);
      console.error('[Import Processor] Error stack:', errorStack);
      
      // Provide more specific error messages
      if (errorMessage.includes('install')) {
        throw new Error(`PDF library error: ${errorMessage}`);
      } else if (errorMessage.includes('no text')) {
        throw new Error('Could not extract text from PDF. The PDF might be image-based or password-protected. Please try converting it to text first.');
      } else if (errorMessage.includes('invalid') || errorMessage.includes('signature')) {
        throw new Error('Invalid PDF file. Please ensure the file is a valid PDF document.');
      } else {
        throw new Error(`Failed to extract text from PDF: ${errorMessage}`);
      }
    }
  }

  private async generateCards(topic: string, text: string) {
    try {
      // Use Ollama to generate flashcards
      const cards = await this.ollama.generateFlashcards(text, topic, 30);
      return cards.map((card) => ({
        ...card,
        excerpt: text.slice(0, 200),
        confidence: 0.8,
      }));
    } catch (error) {
      console.error('Ollama generation failed, using fallback:', error);
      return this.fallbackCards(topic, text);
    }
  }

  private fallbackCards(topic: string, text: string) {
    const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 20 && s.length < 300);
    const cards = [];
    
    for (let i = 0; i < Math.min(8, sentences.length); i++) {
      const sentence = sentences[i];
      cards.push({
        front: `What is an important concept about ${topic}? (${i + 1})`,
        back: sentence,
        type: 'basic',
        excerpt: sentence.slice(0, 180),
        confidence: 0.4,
      });
    }
    
    return cards;
  }
}
