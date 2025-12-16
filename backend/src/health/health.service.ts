import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OllamaService } from '../import/ollama.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ollama: OllamaService,
  ) {}

  async check() {
    const startedAt = Date.now();
    let db = false;
    let ollama = false;

    try {
      // Simple DB ping
      await this.prisma.$queryRaw`SELECT 1`;
      db = true;
    } catch {
      db = false;
    }

    try {
      ollama = await this.ollama.testConnection();
    } catch {
      ollama = false;
    }

    return {
      status: db && ollama ? 'ok' : 'degraded',
      uptimeSec: Math.floor(process.uptime()),
      responseMs: Date.now() - startedAt,
      services: { db, ollama },
      timestamp: new Date().toISOString(),
    };
  }
}
