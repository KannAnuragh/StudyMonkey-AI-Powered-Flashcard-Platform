import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { ImportStatus } from '@prisma/client';
import { ImportUrlDto } from './dto/import-url.dto';
import { ImportFileDto } from './dto/import-file.dto';

@Injectable()
export class ImportService {
  constructor(
    @InjectQueue('import-queue') private importQueue: Queue,
    private prisma: PrismaService,
  ) {}

  async importUrl(userId: string, dto: ImportUrlDto) {
    if (!dto.url) throw new BadRequestException('url required');

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

    await this.importQueue.add('process-url', {
      jobId: job.id,
      url: dto.url,
      userId,
      topic: dto.topic,
      deckId,
    });

    return job;
  }

  async importFile(userId: string, file: Express.Multer.File, dto: ImportFileDto) {
    if (!file) throw new BadRequestException('file required');
    if (file.size > 10_000_000) throw new BadRequestException('file too large (max 10MB)');

    const deckId = await this.ensureDeck(userId, dto.topic, dto.deckId);
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf');

    const job = await this.prisma.importJob.create({
      data: {
        userId,
        sourceType: isPdf ? 'pdf' : 'file',
        sourceMeta: { filename: file.originalname, topic: dto.topic, isPdf },
        status: ImportStatus.pending,
        deckId,
      },
    });

    await this.importQueue.add('process-url', {
      jobId: job.id,
      fileBuffer: file.buffer.toString('base64'), // Convert to base64 for queue serialization
      isPdf,
      userId,
      topic: dto.topic || file.originalname,
      deckId,
      filename: file.originalname,
    });

    return job;
  }

  async getJobStatus(userId: string, jobId: string) {
    const job = await this.prisma.importJob.findFirst({
      where: { id: jobId, userId },
    });

    if (!job) throw new NotFoundException('Job not found');
    if (job.userId !== userId) throw new ForbiddenException('Not your job');
    return job;
  }

  private async ensureDeck(userId: string, topic?: string, deckId?: string) {
    if (deckId) {
      const deck = await this.prisma.deck.findUnique({ where: { id: deckId } });
      if (!deck || deck.ownerId !== userId) throw new ForbiddenException('Deck access denied');
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
