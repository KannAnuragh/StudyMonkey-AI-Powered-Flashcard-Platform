import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OllamaService } from '../import/ollama.service';

@Injectable()
export class StudyService {
  private ollama: OllamaService;

  constructor(private prisma: PrismaService, ollama?: OllamaService) {
    // Allow unit tests to construct without DI
    this.ollama = ollama ?? new OllamaService();
  }

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

  async endSession(userId: string, sessionId: string, generatePerWeakTopic = 5, successThreshold = 0.6) {
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

    if (reviews.length === 0) {
      await this.prisma.studySession.update({ where: { id: sessionId }, data: { endTs, cardsReviewed: 0, correctCount: 0 } });
      return { message: 'No reviews in session', generated: 0, topics: [] };
    }

    const scoreFor = (resp: string) => (resp === 'Easy' ? 1 : resp === 'Good' ? 0.75 : resp === 'Hard' ? 0.25 : 0);

    // Aggregate by topic inferred from tags or content
    type TopicStats = { total: number; positives: number; examples: { deckId: string; text: string }[] };
    const topicStats = new Map<string, TopicStats>();

    for (const r of reviews) {
      const s = scoreFor(r.response);
      const texts = [r.card.front, r.card.back, r.card.sourceExcerpt || ''].join('\n');
      const deckId = r.card.deckId;

      const topics = (Array.isArray((r.card as any).tags) && (r.card as any).tags.length > 0)
        ? (r.card as any).tags as string[]
        : await this.ollama.extractTopics(texts);

      for (const t of topics.slice(0, 3)) {
        const stat = topicStats.get(t) || { total: 0, positives: 0, examples: [] };
        stat.total += 1;
        if (s >= 0.75) stat.positives += 1; // Good/Easy considered success
        // Keep a few examples for generation context
        if (stat.examples.length < 5) stat.examples.push({ deckId, text: texts });
        topicStats.set(t, stat);
      }
    }

    // Compute weak topics
    const weakTopics = [...topicStats.entries()]
      .map(([topic, stat]) => ({ topic, success: stat.total ? stat.positives / stat.total : 0, stat }))
      .filter((t) => t.success < successThreshold)
      .sort((a, b) => a.success - b.success);

    // Prepare generation per topic
    let totalGenerated = 0;
    const perTopicResults: { topic: string; success: number; generated: number }[] = [];

    for (const wt of weakTopics) {
      // Build context from examples belonging to same deck (prefer session deck if set)
      const targetDeckId = session.deckId || (wt.stat.examples[0]?.deckId ?? reviews[0].card.deckId);
      const contextText = wt.stat.examples.map((e) => e.text).join('\n\n').substring(0, 12000);

      // Summarize to keep prompt compact
      const summary = await this.ollama.summarizeText(contextText, 800);
      const genCards = await this.ollama.generateFlashcards(summary, wt.topic, generatePerWeakTopic);

      // Persist cards into target deck
      for (const gc of genCards) {
        await this.prisma.card.create({
          data: {
            deckId: targetDeckId,
            type: (gc.type as string) || 'basic',
            front: gc.front,
            back: gc.back,
            sourceExcerpt: `Adaptive generation for weak topic: ${wt.topic}`,
            tags: Array.isArray(gc.tags) ? gc.tags : [wt.topic, 'adaptive'],
          },
        }).then(async (card) => {
          await this.prisma.schedulerState.create({
            data: { cardId: card.id, ef: 2.5, intervalDays: 0, repetitions: 0, nextDueTs: new Date() },
          });
        });
      }

      totalGenerated += genCards.length;
      perTopicResults.push({ topic: wt.topic, success: wt.success, generated: genCards.length });
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
          weakTopics: perTopicResults,
        } as any,
      },
    });

    return {
      message: totalGenerated > 0 ? 'Adaptive cards generated for weak topics' : 'No weak topics detected',
      generated: totalGenerated,
      topics: perTopicResults,
    };
  }
}
