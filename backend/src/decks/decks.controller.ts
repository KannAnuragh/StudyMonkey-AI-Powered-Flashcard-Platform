import { Controller, Get, Post, Body, Param, UseGuards, Request, Delete } from '@nestjs/common';
import { DecksService } from './decks.service';
import { CreateDeckDto } from './dto/create-deck.dto';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('decks')
export class DecksController {
  constructor(private decksService: DecksService) {}

  @Post()
  create(@Request() req, @Body() dto: CreateDeckDto) {
    return this.decksService.create(req.user.userId, dto);
  }

  @Get()
  findAll(@Request() req) {
    return this.decksService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.decksService.findOne(req.user.userId, id);
  }

  @Delete(':id')
  delete(@Request() req, @Param('id') id: string) {
    return this.decksService.delete(req.user.userId, id);
  }
}
