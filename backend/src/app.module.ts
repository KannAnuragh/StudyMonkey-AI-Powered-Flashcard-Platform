import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DecksModule } from './decks/decks.module';
import { CardsModule } from './cards/cards.module';
import { StudyModule } from './study/study.module';
import { ImportModule } from './import/import.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    DecksModule,
    CardsModule,
    StudyModule,
    ImportModule,
  ],
})
export class AppModule {}
