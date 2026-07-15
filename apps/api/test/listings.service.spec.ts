import { ForbiddenException } from '@nestjs/common';
import { ListingStatus } from '@prisma/client';
import { ListingsService } from '../src/modules/listings/listings.service';
describe('ListingsService lifecycle', () => {
  const listingId = 'listing-1';
  const userId = 'user-1';
  const categoryId = 'cat-1';

  const draftListing = {
    id: listingId,
    userId,
    categoryId,
    title: 'Test İlan',
    description: 'Açıklama metni yeterince uzun',
    slug: 'test-ilan-12345678',
    attributes: { year: 2020, brand: 'BMW' },
    status: ListingStatus.DRAFT,
    images: [],
  };

  const mockPrisma: {
    listing: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
    listingImage: { create: jest.Mock };
    $transaction: jest.Mock;
  } = {
    listing: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    listingImage: { create: jest.fn() },
    $transaction: jest.fn((fn: (tx: typeof mockPrisma) => Promise<unknown>) => fn(mockPrisma)),
  };

  const mockCategories = {
    findById: jest.fn().mockResolvedValue({
      id: categoryId,
      attributeSchema: {
        fields: {
          year: { type: 'number', required: true },
          brand: { type: 'string', required: true },
        },
      },
    }),
  };

  const mockValidator = { validate: jest.fn() };
  const mockOutbox = { write: jest.fn() };
  const mockStorage = { uploadQuarantine: jest.fn() };
  const mockPayments = { assertListingPaymentReady: jest.fn().mockResolvedValue(undefined) };

  let service: ListingsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ListingsService(
      mockPrisma as never,
      mockCategories as never,
      mockValidator as never,
      mockOutbox as never,
      mockStorage as never,
      mockPayments as never,
    );
  });

  it('creates draft listing with validated attributes', async () => {
    mockPrisma.listing.create.mockResolvedValue(draftListing);

    const result = await service.create(userId, {
      categoryId,
      title: 'Test İlan',
      description: 'Açıklama metni yeterince uzun',
      attributes: { year: 2020, brand: 'BMW' },
      currency: 'TRY',
    });

    expect(mockValidator.validate).toHaveBeenCalled();
    expect(result.status).toBe(ListingStatus.DRAFT);
  });

  it('submits draft and writes outbox event in transaction', async () => {
    mockPrisma.listing.findFirst.mockResolvedValue(draftListing);
    mockPrisma.listing.update.mockResolvedValue({
      ...draftListing,
      status: ListingStatus.PENDING,
    });

    const result = await service.submit(userId, listingId);

    expect(result.status).toBe(ListingStatus.PENDING);
    expect(mockOutbox.write).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ eventType: 'listing.submitted' }),
    );
  });

  it('blocks editing non-draft listings', async () => {
    mockPrisma.listing.findFirst.mockResolvedValue({
      ...draftListing,
      status: ListingStatus.PENDING,
    });

    await expect(
      service.update(userId, listingId, { title: 'Yeni başlık' }),
    ).rejects.toThrow(ForbiddenException);
  });
});
