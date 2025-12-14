import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudyService {
  constructor(private prisma: PrismaService) {}

  async getDueCards(userId: string, deckId?: string) {
    return this.prisma.schedulerState.findMany({
      where: {
        nextDueTs: { lte: new Date() },
        card: {
          deck: {
            ownerId: userId,
            ...(deckId ? { id: deckId } : {}),
          },
        },
      },
      include: {
        card: true,
      },
      take: 20,
    });
  }

  async recordReview(userId: string, cardId: string, response: string, latency: number) {
    const state = await this.prisma.schedulerState.findUnique({ where: { cardId }, include: { card: { include: { deck: true } } } });
    if (!state) throw new NotFoundException('Card scheduler state not found');
    if (state.card.deck.ownerId !== userId) throw new ForbiddenException('Not your card');

    let quality = 0;
    if (response === 'Easy') quality = 5;
    if (response === 'Good') quality = 4;
    if (response === 'Hard') quality = 3;
    if (response === 'Again') quality = 0;
    if (quality === 0 && response !== 'Again') {
      throw new BadRequestException('Invalid response value');
    }

    let { ef, intervalDays, repetitions } = state;

    if (quality >= 3) {
      if (repetitions === 0) intervalDays = 1;
      else if (repetitions === 1) intervalDays = 6;
      else intervalDays = Math.ceil(intervalDays * ef);

      repetitions += 1;
      ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
      if (ef < 1.3) ef = 1.3;
    } else {
      repetitions = 0;
      intervalDays = 1;
    }

    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + intervalDays);

    await this.prisma.$transaction([
      this.prisma.review.create({
        data: {
          userId,
          cardId,
          response,
          ease: ef,
          latencyMs: latency,
        },
      }),
      this.prisma.schedulerState.update({
        where: { cardId },
        data: {
          ef,
          intervalDays,
          repetitions,
          lastReviewed: new Date(),
          nextDueTs: nextDue,
        },
      }),
    ]);

    return { nextDue, intervalDays };
  }
}
