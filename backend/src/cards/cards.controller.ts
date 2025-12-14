import { Controller, Post, Body, Param, UseGuards, Request, Get, Patch, Delete } from '@nestjs/common';
import { CardsService } from './cards.service';
import { CreateCardDto, BulkCreateCardsDto, ImportCardsDto } from './dto/create-card.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('decks/:deckId/cards')
export class CardsController {
  constructor(private cardsService: CardsService) {}

  @Post()
  create(@Request() req, @Param('deckId') deckId: string, @Body() dto: CreateCardDto) {
    return this.cardsService.create(req.user.userId, deckId, dto);
  }

  @Post('bulk')
  bulkCreate(@Request() req, @Param('deckId') deckId: string, @Body() dto: BulkCreateCardsDto) {
    return this.cardsService.bulkCreate(req.user.userId, deckId, dto);
  }

  @Post('import')
  importCards(@Request() req, @Param('deckId') deckId: string, @Body() dto: ImportCardsDto) {
    return this.cardsService.importCards(req.user.userId, deckId, dto);
  }

  @Get()
  findAll(@Param('deckId') deckId: string) {
    return this.cardsService.findAll(deckId);
  }

  @Patch(':cardId')
  update(
    @Request() req,
    @Param('deckId') deckId: string,
    @Param('cardId') cardId: string,
    @Body() dto: Partial<CreateCardDto>,
  ) {
    return this.cardsService.update(req.user.userId, cardId, dto);
  }

  @Delete(':cardId')
  delete(@Request() req, @Param('cardId') cardId: string) {
    return this.cardsService.delete(req.user.userId, cardId);
  }
}
