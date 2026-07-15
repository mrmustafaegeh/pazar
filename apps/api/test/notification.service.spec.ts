import { NotificationChannel } from '@prisma/client';
import { NotificationService } from '../src/modules/notifications/notification.service';

describe('NotificationService', () => {
  const prisma = {
    notificationLog: { create: jest.fn() },
    user: { findFirst: jest.fn() },
  };
  const config = {
    get: jest.fn((key: string, fallback?: string) => fallback),
  };

  const service = new NotificationService(prisma as never, config as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.notificationLog.create.mockResolvedValue({});
  });

  it('logs sent email notifications', async () => {
    await service.dispatch({
      channel: NotificationChannel.EMAIL,
      eventType: 'test.event',
      recipient: 'user@example.com',
      body: 'Hello',
    });

    expect(prisma.notificationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'SENT',
          eventType: 'test.event',
          channel: NotificationChannel.EMAIL,
        }),
      }),
    );
  });

  it('handles listing.approved via event handler', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'u1', email: 'seller@example.com' });

    await service.handleEvent('listing.approved', { listingId: 'l1', userId: 'u1' });

    expect(prisma.notificationLog.create).toHaveBeenCalled();
  });
});
