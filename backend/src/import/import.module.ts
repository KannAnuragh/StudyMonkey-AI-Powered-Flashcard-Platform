import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { ImportProcessor } from './import.processor';
import { ImportWorker } from './import.worker';
import { PrismaModule } from '../prisma/prisma.module';
import { OllamaService } from './ollama.service';

@Module({
  imports: [
    PrismaModule,
    ...(process.env.REDIS_URL
      ? [
          BullModule.registerQueue({
            name: 'import-queue',
          }),
        ]
      : []),
  ],
  controllers: [ImportController],
  providers: [
    ImportService,
    ImportProcessor,
    ...(process.env.REDIS_URL ? [ImportWorker] : []),
    OllamaService,
  ],
  exports: [OllamaService],
})
export class ImportModule {}
