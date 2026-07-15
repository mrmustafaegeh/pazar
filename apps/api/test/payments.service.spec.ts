import { ForbiddenException } from '@nestjs/common';
import { PaymentRecordStatus, PaymentStatus, PricingTier } from '@prisma/client';
import { PaymentsService } from '../src/modules/payments/payments.service';

describe('PaymentsService', () => {
  const userId = 'user-1';
  const listingId = 'listing-1';

  const mockPrisma: {
    featureFlag: { findUnique: jest.Mock };
    listing: { findFirst: jest.Mock; update: jest.Mock };
    payment: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
    $transaction: jest.Mock;
  } = {
    featureFlag: { findUnique: jest.fn() },
    listing: { findFirst: jest.fn(), update: jest.fn() },
    payment: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma)),
  };

  const mockProvider = {
    createCheckoutSession: jest.fn().mockResolvedValue({
      providerRef: 'mock_ref_1',
      checkoutUrl: 'http://localhost/mock',
    }),
  };

  const mockOutbox = { write: jest.fn() };

  let service: PaymentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.featureFlag.findUnique.mockResolvedValue({ key: 'payments_enabled', enabled: true });
    mockPrisma.listing.findFirst.mockResolvedValue({
      id: listingId,
      userId,
      status: 'DRAFT',
    });
    mockPrisma.payment.findUnique.mockResolvedValue(null);
    mockPrisma.payment.create.mockResolvedValue({
      id: 'pay-1',
      userId,
      listingId,
      amount: 99,
      currency: 'TRY',
      status: PaymentRecordStatus.PENDING,
      idempotencyKey: 'idem-1',
      providerRef: null,
      metadata: { pricingTier: 'STANDARD' },
      createdAt: new Date(),
    });
    mockPrisma.payment.update.mockResolvedValue({
      id: 'pay-1',
      userId,
      listingId,
      amount: 99,
      currency: 'TRY',
      status: PaymentRecordStatus.COMPLETED,
      idempotencyKey: 'idem-1',
      providerRef: 'mock_ref_1',
      metadata: { pricingTier: 'STANDARD' },
      createdAt: new Date(),
    });

    service = new PaymentsService(
      mockPrisma as never,
      mockProvider as never,
      mockOutbox as never,
    );
  });

  it('rejects checkout when payments disabled', async () => {
    mockPrisma.featureFlag.findUnique.mockResolvedValue({ enabled: false });

    await expect(
      service.createCheckout(userId, {
        listingId,
        pricingTier: 'STANDARD',
        idempotencyKey: 'idem-1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('returns existing completed payment for duplicate idempotency key', async () => {
    mockPrisma.payment.findUnique.mockResolvedValue({
      id: 'pay-existing',
      userId,
      listingId,
      amount: 99,
      currency: 'TRY',
      status: PaymentRecordStatus.COMPLETED,
      idempotencyKey: 'idem-1',
      providerRef: 'ref',
      metadata: { pricingTier: 'STANDARD' },
      createdAt: new Date(),
    });

    const result = await service.createCheckout(userId, {
      listingId,
      pricingTier: 'STANDARD',
      idempotencyKey: 'idem-1',
    });

    expect(result.status).toBe('COMPLETED');
    expect(mockPrisma.payment.create).not.toHaveBeenCalled();
  });

  it('completes payment and updates listing tier', async () => {
    mockPrisma.payment.findUnique.mockResolvedValue({
      id: 'pay-1',
      userId,
      listingId,
      amount: 99,
      currency: 'TRY',
      status: PaymentRecordStatus.PENDING,
      idempotencyKey: 'idem-1',
      providerRef: null,
      metadata: { pricingTier: 'PREMIUM' },
      listing: { id: listingId },
    });

    const result = await service.completePayment('idem-1', 'provider_ref');

    expect(result.status).toBe('COMPLETED');
    expect(mockPrisma.listing.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: listingId },
        data: expect.objectContaining({
          pricingTier: PricingTier.PREMIUM,
          paymentStatus: PaymentStatus.PAID,
        }),
      }),
    );
    expect(mockOutbox.write).toHaveBeenCalledWith(
      mockPrisma,
      expect.objectContaining({ eventType: 'payment.completed' }),
    );
  });

  it('blocks submit when paid tier without payment', async () => {
    await expect(
      service.assertListingPaymentReady({
        pricingTier: PricingTier.PREMIUM,
        paymentStatus: PaymentStatus.PENDING,
      }),
    ).rejects.toThrow('ödeme tamamlanmalıdır');
  });
});
