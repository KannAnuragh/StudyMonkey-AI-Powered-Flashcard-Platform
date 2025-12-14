import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCardDto, BulkCreateCardsDto, ImportCardsDto } from './dto/create-card.dto';

@Injectable()
export class CardsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, deckId: string, dto: CreateCardDto) {
    const deck = await this.prisma.deck.findUnique({ where: { id: deckId } });
    if (!deck) throw new NotFoundException('Deck not found');
    if (deck.ownerId !== userId) throw new ForbiddenException('Access denied');

    const card = await this.prisma.card.create({
      data: {
        deckId,
        type: dto.type || 'basic',
        front: dto.front,
        back: dto.back,
        sourceUrl: dto.sourceUrl,
        sourceExcerpt: dto.sourceExcerpt,
      },
    });

    // Initialize scheduler state
    await this.prisma.schedulerState.create({
      data: {
        cardId: card.id,
        ef: 2.5,
        intervalDays: 0,
        repetitions: 0,
        nextDueTs: new Date(),
      },
    });

    return card;
  }

  async bulkCreate(userId: string, deckId: string, dto: BulkCreateCardsDto) {
    const deck = await this.prisma.deck.findUnique({ where: { id: deckId } });
    if (!deck) throw new NotFoundException('Deck not found');
    if (deck.ownerId !== userId) throw new ForbiddenException('Access denied');

    const cards = [];
    for (const cardDto of dto.cards) {
      const card = await this.create(userId, deckId, cardDto);
      cards.push(card);
    }
    return { count: cards.length, cards };
  }

  async importCards(userId: string, deckId: string, dto: ImportCardsDto) {
    const deck = await this.prisma.deck.findUnique({ where: { id: deckId } });
    if (!deck) throw new NotFoundException('Deck not found');
    if (deck.ownerId !== userId) throw new ForbiddenException('Access denied');

    let cards: any[] = [];

    if (dto.format === 'csv') {
      cards = this.parseCSV(dto.content, dto.delimiter || ',');
    } else if (dto.format === 'markdown') {
      cards = this.parseMarkdown(dto.content);
    } else if (dto.format === 'json') {
      try {
        cards = JSON.parse(dto.content);
      } catch {
        throw new BadRequestException('Invalid JSON format');
      }
    }

    if (!Array.isArray(cards) || cards.length === 0) {
      throw new BadRequestException('No valid cards found in import');
    }

    const created = [];
    for (const cardData of cards) {
      try {
        const card = await this.create(userId, deckId, {
          front: cardData.front || cardData.question || cardData.q || '',
          back: cardData.back || cardData.answer || cardData.a || '',
          type: cardData.type || 'basic',
        });
        created.push(card);
      } catch (err) {
        console.error('Error creating card:', err);
      }
    }

    return { count: created.length, cards: created };
  }

  private parseCSV(content: string, delimiter: string): any[] {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase());
    const cards = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map((v) => v.trim());
      if (values.length >= 2) {
        const card = {};
        headers.forEach((header, idx) => {
          card[header] = values[idx] || '';
        });
        cards.push(card);
      }
    }

    return cards;
  }

  private parseMarkdown(content: string): any[] {
    const cards = [];
    // Parse Q & A separated by ---
    // Format: # Question\nAnswer\n---\n# Next Question\n...
    const blocks = content.split('---').map((b) => b.trim());

    for (const block of blocks) {
      if (!block) continue;
      const lines = block.split('\n').filter((l) => l.trim());
      if (lines.length >= 2) {
        const front = lines[0].replace(/^#+\s*/, '');
        const back = lines.slice(1).join('\n');
        cards.push({ front, back });
      }
    }

    return cards;
  }

  async findAll(deckId: string) {
    return this.prisma.card.findMany({
      where: { deckId },
      include: { schedulerState: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(userId: string, cardId: string, dto: Partial<CreateCardDto>) {
    const card = await this.prisma.card.findUnique({ where: { id: cardId } });
    if (!card) throw new NotFoundException('Card not found');

    const deck = await this.prisma.deck.findUnique({ where: { id: card.deckId } });
    if (deck.ownerId !== userId) throw new ForbiddenException('Access denied');

    return this.prisma.card.update({
      where: { id: cardId },
      data: {
        front: dto.front,
        back: dto.back,
        sourceUrl: dto.sourceUrl,
      },
    });
  }

  async delete(userId: string, cardId: string) {
    const card = await this.prisma.card.findUnique({ where: { id: cardId } });
    if (!card) throw new NotFoundException('Card not found');

    const deck = await this.prisma.deck.findUnique({ where: { id: card.deckId } });
    if (deck.ownerId !== userId) throw new ForbiddenException('Access denied');

    await this.prisma.schedulerState.delete({ where: { cardId } }).catch(() => {});
    await this.prisma.review.deleteMany({ where: { cardId } });
    return this.prisma.card.delete({ where: { id: cardId } });
  }
}
