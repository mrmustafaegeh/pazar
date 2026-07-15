import { KvkkService } from '../src/modules/kvkk/kvkk.service';

describe('KvkkService', () => {
  const prisma = {
    user: { findFirst: jest.fn(), update: jest.fn() },
    listing: { updateMany: jest.fn() },
    ticket: { create: jest.fn(), update: jest.fn() },
    $transaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        ticket: { create: jest.fn().mockResolvedValue({ id: 't1', type: 'DATA_REQUEST', subject: 'test' }) },
        outbox: { create: jest.fn() },
        listing: { updateMany: jest.fn() },
        user: { update: jest.fn() },
      }),
    ),
  };
  const outbox = { write: jest.fn() };
  const audit = { log: jest.fn() };

  const service = new KvkkService(prisma as never, outbox as never, audit as never);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findFirst.mockResolvedValue({ id: 'u1', email: 'user@example.com' });
  });

  it('queues data export request', async () => {
    const result = await service.requestDataExport('u1');
    expect(result.ticketId).toBe('t1');
    expect(outbox.write).toHaveBeenCalled();
  });

  it('builds export bundle with user data', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'u1',
      email: 'user@example.com',
      listings: [],
      ticketsCreated: [],
      messagesSent: [],
    });

    const bundle = await service.buildExportBundle('u1');
    expect(bundle.user.email).toBe('user@example.com');
    expect(bundle.exportedAt).toBeDefined();
  });
});
