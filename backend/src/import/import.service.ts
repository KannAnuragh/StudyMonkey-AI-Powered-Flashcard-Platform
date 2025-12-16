import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { ImportStatus } from '@prisma/client';
import { ImportUrlDto } from './dto/import-url.dto';
import { ImportFileDto } from './dto/import-file.dto';
import { ImportProcessor } from './import.processor';

@Injectable()
export class ImportService {
  constructor(
    @Optional() @InjectQueue('import-queue') private readonly importQueue: Queue | undefined,
    private readonly prisma: PrismaService,
    @Optional() private readonly processor: ImportProcessor,
  ) {
    console.log('[ImportService] Redis/queue available:', !!this.importQueue);
  }

  async importUrl(userId: string, dto: ImportUrlDto) {
    if (!dto.url) {
      throw new BadRequestException('url required');
    }

    const deckId = await this.ensureDeck(userId, dto.topic, dto.deckId);

    const job = await this.prisma.importJob.create({
      data: {
        userId,
        sourceType: 'url',
        sourceMeta: { url: dto.url, topic: dto.topic },
        status: ImportStatus.pending,
        deckId,
      },
    });

    // Try to queue if available, otherwise process synchronously
    let queued = false;
    if (this.importQueue) {
      try {
        console.log('[Import Service] Attempting to queue job', {
          jobId: job.id,
          url: dto.url,
          topic: dto.topic,
        });
        await this.importQueue.add(
          'process-url',
          {
            jobId: job.id,
            url: dto.url,
            userId,
            topic: dto.topic,
            deckId,
          },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
          },
        );
        console.log(`[Import Service] Job ${job.id} queued successfully`);
        queued = true;
      } catch (error) {
        console.error('[Import Service] Failed to enqueue job', {
          jobId: job.id,
          url: dto.url,
          topic: dto.topic,
          errorName: error?.name,
          errorMessage: error?.message,
          errorStack: error?.stack,
        });
        throw error;
      }
    } else {
      console.warn('[Import Service] importQueue not configured; using sync processing');
    }
    
    if (!queued) {
      console.log('[Import Service] Processing synchronously (no Redis)');
      if (this.processor) {
        setImmediate(async () => {
          try {
            await this.processor.process({
              data: {
                jobId: job.id,
                url: dto.url,
                userId,
                topic: dto.topic,
                deckId,
              },
            } as any);
          } catch (err) {
            console.error('[Import Service] Sync processing failed:', err);
          }
        });
      } else {
        console.error('[Import Service] No processor available for sync fallback');
      }
    }

    return job;
  }

  async importFile(
    userId: string,
    file: Express.Multer.File,
    dto: ImportFileDto,
  ) {
    if (!file) {
      throw new BadRequestException('file required');
    }

    if (file.size > 10_000_000) {
      throw new BadRequestException('file too large (max 10MB)');
    }

    const deckId = await this.ensureDeck(userId, dto.topic, dto.deckId);
    const isPdf =
      file.mimetype === 'application/pdf' ||
      file.originalname.endsWith('.pdf');

    const job = await this.prisma.importJob.create({
      data: {
        userId,
        sourceType: isPdf ? 'pdf' : 'file',
        sourceMeta: {
          filename: file.originalname,
          topic: dto.topic,
          isPdf,
        },
        status: ImportStatus.pending,
        deckId,
      },
    });

    await this.importQueue.add(
      'process-url',
      {
        jobId: job.id,
        fileBuffer: file.buffer.toString('base64'),
        isPdf,
        userId,
        topic: dto.topic || file.originalname,
        deckId,
        filename: file.originalname,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );

    return job;
  }

  async getJobStatus(userId: string, jobId: string) {
    const job = await this.prisma.importJob.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.userId !== userId) {
      throw new ForbiddenException('Not your job');
    }

    // If job is still pending, try to process it synchronously (fallback when Redis unavailable)
    if (job.status === ImportStatus.pending && this.processor) {
      console.log(`[Import Service] Job ${jobId} still pending, attempting sync processing...`);
      try {
        const sourceMeta = job.sourceMeta as any;
        await this.processor.process({
          data: {
            jobId: job.id,
            url: sourceMeta?.url,
            topic: sourceMeta?.topic,
            userId: job.userId,
            deckId: job.deckId,
            fileBuffer: sourceMeta?.fileBuffer,
            isPdf: sourceMeta?.isPdf,
            filename: sourceMeta?.filename,
          },
        } as any);
      } catch (error) {
        console.error(`[Import Service] Sync processing failed for ${jobId}:`, error);
      }
      
      // Re-fetch updated status
      return this.prisma.importJob.findFirst({
        where: { id: jobId, userId },
      });
    }

    return job;
  }

  private async ensureDeck(
    userId: string,
    topic?: string,
    deckId?: string,
  ) {
    if (deckId) {
      const deck = await this.prisma.deck.findUnique({
        where: { id: deckId },
      });

      if (!deck || deck.ownerId !== userId) {
        throw new ForbiddenException('Deck access denied');
      }

      return deck.id;
    }

    const title = topic?.trim() || 'Imported deck';

    const deck = await this.prisma.deck.create({
      data: {
        ownerId: userId,
        title,
        description: 'Generated from import',
      },
    });

    return deck.id;
  }
}
