import { Module } from '@nestjs/common';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { BullModule } from '@nestjs/bull';
import { ImportProcessor } from './import.processor';
import { PrismaService } from '../prisma/prisma.service';
import { OllamaService } from './ollama.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'import-queue',
    }),
  ],
  providers: [ImportService, ImportProcessor, PrismaService, OllamaService],
  controllers: [ImportController],
  exports: [OllamaService],
})
export class ImportModule {}
