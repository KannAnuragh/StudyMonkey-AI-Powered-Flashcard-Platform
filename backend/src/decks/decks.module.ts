import { Module } from '@nestjs/common';
import { DecksService } from './decks.service';
import { DecksController } from './decks.controller';

@Module({
  providers: [DecksService],
  controllers: [DecksController],
})
export class DecksModule {}
