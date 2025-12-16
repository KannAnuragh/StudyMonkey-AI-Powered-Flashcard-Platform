import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DecksModule } from './decks/decks.module';
import { CardsModule } from './cards/cards.module';
import { StudyModule } from './study/study.module';
import { ImportModule } from './import/import.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Only register BullMQ if Redis is available
    ...(process.env.REDIS_URL
      ? [
          BullModule.forRoot({
            connection: {
              host: process.env.REDIS_URL.replace('redis://', '').split(':')[0],
              port: parseInt(process.env.REDIS_URL.replace('redis://', '').split(':')[1] || '6379'),
              maxRetriesPerRequest: null,
              enableReadyCheck: false,
            },
          }),
        ]
      : []),

    PrismaModule,
    AuthModule,
    DecksModule,
    CardsModule,
    StudyModule,
    ImportModule,
    HealthModule,
  ],
})
export class AppModule {}
