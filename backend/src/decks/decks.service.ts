import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeckDto } from './dto/create-deck.dto';

@Injectable()
export class DecksService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateDeckDto) {
    return this.prisma.deck.create({
      data: {
        title: dto.title,
        description: dto.description,
        visibility: dto.visibility,
        mode: dto.mode || 'standard',
        languageCode: dto.languageCode,
        ownerId: userId,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.deck.findMany({
      where: {
        ownerId: userId,
      },
      include: {
        cards: {
          select: { id: true }
        }
      }
    });
  }

  async findOne(userId: string, deckId: string) {
    return this.prisma.deck.findUnique({
      where: {
        id: deckId,
        ownerId: userId,
      },
      include: {
        cards: true,
      },
    });
  }

  async delete(userId: string, deckId: string) {
    // Verify ownership first
    const deck = await this.prisma.deck.findUnique({
      where: {
        id: deckId,
        ownerId: userId,
      },
      include: {
        cards: {
          select: { id: true }
        }
      }
    });

    if (!deck) {
      throw new Error('Deck not found or unauthorized');
    }

    // Get all card IDs
    const cardIds = deck.cards.map(card => card.id);

    // Use a transaction to ensure all deletes happen together
    return await this.prisma.$transaction(async (tx) => {
      // Delete scheduler states for all cards
      if (cardIds.length > 0) {
        await tx.schedulerState.deleteMany({
          where: {
            cardId: { in: cardIds }
          }
        });

        // Delete reviews for all cards
        await tx.review.deleteMany({
          where: {
            cardId: { in: cardIds }
          }
        });

        // Delete all cards in the deck
        await tx.card.deleteMany({
          where: {
            deckId: deckId,
          },
        });
      }

      // Delete import jobs associated with this deck
      await tx.importJob.updateMany({
        where: {
          deckId: deckId,
        },
        data: {
          deckId: null,
        }
      });

      // Delete deck analytics if exists
      await tx.deckAnalytics.deleteMany({
        where: {
          deckId: deckId,
        }
      });

      // Finally delete the deck
      return await tx.deck.delete({
        where: {
          id: deckId,
        },
      });
    });
  }
}
