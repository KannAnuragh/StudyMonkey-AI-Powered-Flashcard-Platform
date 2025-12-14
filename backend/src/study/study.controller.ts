import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { StudyService } from './study.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('study')
export class StudyController {
  constructor(private studyService: StudyService) {}

  @Get('next')
  getNext(@Request() req, @Query('deckId') deckId: string) {
    return this.studyService.getDueCards(req.user.userId, deckId);
  }

  @Post('review')
  recordReview(@Request() req, @Body() body: { cardId: string; response: string; latency: number }) {
    return this.studyService.recordReview(req.user.userId, body.cardId, body.response, body.latency);
  }
}
