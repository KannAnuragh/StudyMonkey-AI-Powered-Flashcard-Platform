import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { StudyService } from '../src/study/study.service';

const now = new Date();

function createPrismaMock() {
  const schedulerState = {
    findUnique: jest.fn(),
    update: jest.fn(),
  };
  const review = {
    create: jest.fn(),
  };

  const prisma = {
    schedulerState,
    review,
    $transaction: jest.fn((actions: any[]) => Promise.all(actions)),
  } as any;

  return prisma;
}

describe('StudyService SM-2', () => {
  it('schedules correctly for Good (quality 4)', async () => {
    const prisma = createPrismaMock();
    const state = {
      cardId: 'c1',
      ef: 2.5,
      intervalDays: 0,
      repetitions: 0,
      card: { deck: { ownerId: 'u1' } },
    };
    prisma.schedulerState.findUnique.mockResolvedValue(state);
    prisma.review.create.mockResolvedValue({ id: 'r1' });
    prisma.schedulerState.update.mockResolvedValue({});

    const service = new StudyService(prisma);
    const result = await service.recordReview('u1', 'c1', 'Good', 1200);

    expect(prisma.review.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'u1', cardId: 'c1', response: 'Good', latencyMs: 1200 }),
      })
    );
    expect(prisma.schedulerState.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { cardId: 'c1' },
        data: expect.objectContaining({ repetitions: 1, intervalDays: 1 }),
      })
    );
    // intervalDays should be 1 for first successful rep
    expect(result.intervalDays).toBe(1);
  });

  it('resets repetitions on Again (quality 0)', async () => {
    const prisma = createPrismaMock();
    const state = {
      cardId: 'c2',
      ef: 2.3,
      intervalDays: 5,
      repetitions: 3,
      card: { deck: { ownerId: 'u1' } },
    };
    prisma.schedulerState.findUnique.mockResolvedValue(state);
    prisma.review.create.mockResolvedValue({ id: 'r2' });
    prisma.schedulerState.update.mockResolvedValue({});

    const service = new StudyService(prisma);
    await service.recordReview('u1', 'c2', 'Again', 800);

    expect(prisma.schedulerState.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ repetitions: 0, intervalDays: 1 }),
      })
    );
  });

  it('throws NotFound when no scheduler state', async () => {
    const prisma = createPrismaMock();
    prisma.schedulerState.findUnique.mockResolvedValue(null);
    const service = new StudyService(prisma);
    await expect(service.recordReview('u1', 'missing', 'Good', 500)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws Forbidden when card does not belong to user', async () => {
    const prisma = createPrismaMock();
    prisma.schedulerState.findUnique.mockResolvedValue({ card: { deck: { ownerId: 'other' } } });
    const service = new StudyService(prisma);
    await expect(service.recordReview('u1', 'c1', 'Good', 500)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
