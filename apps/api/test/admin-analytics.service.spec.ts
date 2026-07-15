import { AdminAnalyticsService } from '../src/modules/admin/admin-analytics.service';

describe('AdminAnalyticsService', () => {
  const prisma = {
    user: { count: jest.fn() },
    listing: { groupBy: jest.fn(), count: jest.fn() },
    ticket: { count: jest.fn() },
  };

  const service = new AdminAnalyticsService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.count
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(80);
    prisma.listing.groupBy.mockResolvedValue([
      { status: 'APPROVED', _count: { _all: 42 } },
      { status: 'PENDING', _count: { _all: 5 } },
    ]);
    prisma.ticket.count
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(10);
    prisma.listing.count.mockResolvedValue(5);
  });

  it('returns aggregated dashboard metrics', async () => {
    const result = await service.getOverview();

    expect(result.users).toEqual({ total: 100, verified: 80 });
    expect(result.listings).toEqual({ APPROVED: 42, PENDING: 5 });
    expect(result.tickets).toEqual({ open: 3, inProgress: 2, total: 10 });
    expect(result.moderation.pending).toBe(5);
  });
});
