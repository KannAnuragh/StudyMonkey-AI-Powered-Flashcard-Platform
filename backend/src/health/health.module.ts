import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { PrismaService } from '../prisma/prisma.service';
import { ImportModule } from '../import/import.module';

@Module({
  imports: [ImportModule],
  controllers: [HealthController],
  providers: [HealthService, PrismaService],
})
export class HealthModule {}
