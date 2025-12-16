import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { OllamaService } from './ollama.service';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { ImportStatus } from '@prisma/client';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ImportProcessor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ollama: OllamaService,
  ) {}

  async process(job: Job | { data: any }) {
    const {
      jobId,
      url,
      rawText,
      fileBuffer,
      isPdf,
      userId,
      topic,
      deckId,
      filename,
    } = job.data;

    console.log(`[Import Processor] Job ${jobId} started`);

    await this.prisma.importJob.update({
      where: { id: jobId },
      data: { status: ImportStatus.processing },
    });

    try {
      let content: string;

      if (fileBuffer && isPdf) {
        console.log(`[Import Processor] Extracting PDF text...`);
        const buffer =
          typeof fileBuffer === 'string'
            ? Buffer.from(fileBuffer, 'base64')
            : Buffer.from(fileBuffer);

        content = await this.extractPdfText(buffer);
      } else if (rawText) {
        content = rawText;
      } else if (url) {
        console.log(`[Import Processor] Fetching URL: ${url}`);
        content = await this.fetchUrlText(url);
      } else {
        throw new Error('No content source provided');
      }

      const cardTopic = topic || url || filename || 'Imported deck';
      const cards = await this.generateCards(cardTopic, content);

      await this.prisma.importJob.update({
        where: { id: jobId },
        data: {
          previewCards: cards,
          resultSummary: `Generated ${cards.length} cards`,
        },
      });

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
            confidenceScore: card.confidence ?? null,
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

      await this.prisma.importJob.update({
        where: { id: jobId },
        data: {
          status: ImportStatus.completed,
          completedAt: new Date(),
        },
      });

      console.log(`[Import Processor] Job ${jobId} completed successfully`);
    } catch (error) {
      const message = (error as Error)?.message || 'Unknown error';
      const stack = (error as Error)?.stack;

      console.error(`[Import Processor] Job ${jobId} failed`, message);

      await this.prisma.importJob.update({
        where: { id: jobId },
        data: {
          status: ImportStatus.failed,
          error: stack ? `${message}\n${stack}` : message,
        },
      });

      throw error; // IMPORTANT: let BullMQ mark job as failed
    }
  }

  /* ---------------- helpers ---------------- */

  private async fetchUrlText(url: string) {
    const res = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120',
      },
    });

    const $ = cheerio.load(res.data);
    $('script, style, nav, footer, header').remove();

    return $('body')
      .text()
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 12000);
  }

  private async extractPdfText(buffer: Buffer): Promise<string> {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);

    if (!data.text || !data.text.trim()) {
      throw new Error('No text extracted from PDF');
    }

    return data.text;
  }

  private async generateCards(topic: string, text: string) {
    const cards = await this.ollama.generateFlashcards(text, topic, 30);
    return cards.map((card) => ({
      ...card,
      excerpt: text.slice(0, 200),
      confidence: 0.8,
    }));
  }
}
