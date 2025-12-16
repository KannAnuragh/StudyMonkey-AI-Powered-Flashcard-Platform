import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OllamaService } from '../import/ollama.service';

@Injectable()
export class StudyService {
  constructor(
    private prisma: PrismaService,
    private ollama: OllamaService,
  ) {}

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

  async startSession(userId: string, deckId?: string) {
    const session = await this.prisma.studySession.create({
      data: { userId, deckId: deckId || null },
    });
    return { sessionId: session.id, startTs: session.startTs };
  }

  async endSession(userId: string, sessionId: string) {
    console.log(`[Study Service] Ending session ${sessionId} for user ${userId}`);
    const session = await this.prisma.studySession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Study session not found');
    if (session.userId !== userId) throw new ForbiddenException('Not your session');

    const endTs = new Date();

    // Fetch reviews within the session window
    const reviews = await this.prisma.review.findMany({
      where: {
        userId,
        timestamp: { gte: session.startTs, lte: endTs },
      },
      include: { card: true },
    });

    console.log(`[Study Service] Found ${reviews.length} reviews in session`);

    if (reviews.length === 0) {
      await this.prisma.studySession.update({ where: { id: sessionId }, data: { endTs, cardsReviewed: 0, correctCount: 0 } });
      return { message: 'No reviews in session', generated: 0, byDifficulty: [] };
    }

    // Group reviews by difficulty and extract topics
    type DifficultyGroup = { 
      difficulty: string; 
      count: number; 
      cardsToGenerate: number;
      reviews: Array<{ card: any; topics: string[]; deckId: string }>;
    };
    
    const difficultyGroups = new Map<string, DifficultyGroup>();
    const existingCardFronts = new Set<string>();

    // Get all existing cards in session decks to avoid duplicates
    const deckIds = [...new Set(reviews.map(r => r.card.deckId))];
    const existingCards = await this.prisma.card.findMany({
      where: { deckId: { in: deckIds } },
      select: { front: true },
    });
    existingCards.forEach(c => existingCardFronts.add(c.front.toLowerCase().trim()));

    for (const r of reviews) {
      const texts = [r.card.front, r.card.back, r.card.sourceExcerpt || ''].join('\n');
      const topics = (Array.isArray((r.card as any).tags) && (r.card as any).tags.length > 0)
        ? (r.card as any).tags as string[]
        : await this.ollama.extractTopics(texts);

      const difficulty = r.response; // Again, Hard, Good, Easy
      
      if (!difficultyGroups.has(difficulty)) {
        // Determine how many cards to generate based on difficulty
        let cardsToGenerate = 0;
        if (difficulty === 'Again') cardsToGenerate = 4; // Too difficult: 3-5 cards (using 4)
        else if (difficulty === 'Hard') cardsToGenerate = 2; // Difficult: 1-2 cards
        else if (difficulty === 'Good') cardsToGenerate = 1; // Good: 1 card
        else if (difficulty === 'Easy') cardsToGenerate = 0; // Easy: no card

        difficultyGroups.set(difficulty, {
          difficulty,
          count: 0,
          cardsToGenerate,
          reviews: [],
        });
      }

      const group = difficultyGroups.get(difficulty)!;
      group.count += 1;
      group.reviews.push({ card: r.card, topics: topics.slice(0, 3), deckId: r.card.deckId });
    }

    // Generate cards for each difficulty group
    let totalGenerated = 0;
    const generationResults: Array<{ difficulty: string; count: number; generated: number; topics: string[] }> = [];

    console.log(`[Study Service] Processing ${difficultyGroups.size} difficulty groups for card generation`);

    for (const [difficulty, group] of difficultyGroups.entries()) {
      console.log(`[Study Service] Group ${difficulty}: ${group.count} reviews, ${group.cardsToGenerate} cards to generate`);
      
      if (group.cardsToGenerate === 0 || group.reviews.length === 0) {
        generationResults.push({ difficulty, count: group.count, generated: 0, topics: [] });
        continue;
      }

      // Aggregate topics from all reviews in this difficulty group
      const topicSet = new Set<string>();
      group.reviews.forEach(r => r.topics.forEach(t => topicSet.add(t)));
      const uniqueTopics = Array.from(topicSet).slice(0, 5);

      // Build context from the difficult cards
      const contextCards = group.reviews.map(r => 
        `Q: ${r.card.front}\nA: ${r.card.back}\nTopics: ${r.topics.join(', ')}`
      ).join('\n\n');

      const targetDeckId = session.deckId || group.reviews[0].deckId;
      
      // Generate cards for each topic
      const cardsPerTopic = Math.ceil(group.cardsToGenerate / Math.max(1, uniqueTopics.length));
      let generatedInGroup = 0;

      for (const topic of uniqueTopics) {
        const prompt = `You are creating ${cardsPerTopic} NEW flashcards about "${topic}" for a student who found this difficult.

CONTEXT - Student struggled with these cards:
${contextCards.substring(0, 6000)}

INSTRUCTIONS:
1. Create ${cardsPerTopic} COMPLETELY NEW questions about "${topic}"
2. Questions must be DIFFERENT from the context cards above
3. Focus on reinforcing understanding of "${topic}"
4. Make questions clear and answers complete
5. Each card should test a unique aspect of "${topic}"

Return ONLY a valid JSON array:
[
  {
    "front": "New unique question about ${topic}?",
    "back": "Clear answer",
    "tags": ["${topic}"]
  }
]

Generate exactly ${cardsPerTopic} NEW flashcards. Return ONLY the JSON array.`;

        try {
          const genCards = await this.ollama.generateAdaptiveCards(topic, contextCards, cardsPerTopic);
          
          if (!Array.isArray(genCards)) continue;

          // Filter out duplicates and persist
          for (const gc of genCards) {
            if (!gc.front || !gc.back) continue;
            
            const normalizedFront = gc.front.toLowerCase().trim();
            if (existingCardFronts.has(normalizedFront)) {
              console.log(`[Study] Skipping duplicate card: ${gc.front.substring(0, 50)}...`);
              continue;
            }

            const card = await this.prisma.card.create({
              data: {
                deckId: targetDeckId,
                type: 'basic',
                front: gc.front.trim(),
                back: gc.back.trim(),
                sourceExcerpt: `Generated after ${difficulty} response - Topic: ${topic}`,
                tags: [topic, 'adaptive', difficulty.toLowerCase()],
              },
            });

            await this.prisma.schedulerState.create({
              data: { cardId: card.id, ef: 2.5, intervalDays: 0, repetitions: 0, nextDueTs: new Date() },
            });

            existingCardFronts.add(normalizedFront);
            generatedInGroup += 1;
            totalGenerated += 1;
          }
        } catch (error) {
          console.error(`[Study] Generation error for topic ${topic}:`, error);
        }
      }

      generationResults.push({
        difficulty,
        count: group.count,
        generated: generatedInGroup,
        topics: uniqueTopics,
      });
    }

    const correctCount = reviews.filter((r) => r.response === 'Good' || r.response === 'Easy').length;
    await this.prisma.studySession.update({
      where: { id: sessionId },
      data: {
        endTs,
        cardsReviewed: reviews.length,
        correctCount,
        stats: {
          avgLatency: Math.round(
            reviews.reduce((acc, r) => acc + (r.latencyMs || 0), 0) / Math.max(1, reviews.length)
          ),
          accuracy: Math.round((correctCount / reviews.length) * 100),
          generationResults,
        } as any,
      },
    });

    return {
      message: totalGenerated > 0 ? `Generated ${totalGenerated} new cards based on difficulty` : 'No cards needed',
      generated: totalGenerated,
      byDifficulty: generationResults,
    };
  }
}
