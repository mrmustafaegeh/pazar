import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ListingStatus, Prisma } from '@prisma/client';
import type { CreateListingInput, SearchListingsInput, UpdateListingInput } from '@turkiye-pazaryeri/types';
import { randomUUID } from 'crypto';
import fileType from 'file-type';
import type { Express } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { listingSlug } from '../../common/utils/slug.util';
import { AttributeValidatorService } from '../categories/attribute-validator.service';
import { CategoriesService } from '../categories/categories.service';
import { OutboxService } from '../outbox/outbox.service';
import { PaymentsService } from '../payments/payments.service';
import { StorageService } from '../../storage/storage.service';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categories: CategoriesService,
    private readonly attributeValidator: AttributeValidatorService,
    private readonly outbox: OutboxService,
    private readonly storage: StorageService,
    private readonly payments: PaymentsService,
  ) {}

  async create(userId: string, input: CreateListingInput) {
    const category = await this.categories.findById(input.categoryId);
    this.attributeValidator.validate(
      category.attributeSchema as Record<string, unknown>,
      input.attributes,
    );

    const id = randomUUID();
    const slug = listingSlug(input.title, id);

    return this.prisma.listing.create({
      data: {
        id,
        userId,
        categoryId: input.categoryId,
        title: input.title,
        description: input.description,
        slug,
        attributes: input.attributes as Prisma.InputJsonValue,
        price: input.price,
        currency: input.currency ?? 'TRY',
        city: input.city,
        district: input.district,
        status: ListingStatus.DRAFT,
      },
      include: { category: true, images: true },
    });
  }

  async update(userId: string, listingId: string, input: UpdateListingInput) {
    const listing = await this.getOwnedDraft(userId, listingId);

    if (input.categoryId || input.attributes) {
      const category = await this.categories.findById(input.categoryId ?? listing.categoryId);
      this.attributeValidator.validate(
        category.attributeSchema as Record<string, unknown>,
        (input.attributes ?? listing.attributes) as Record<string, unknown>,
      );
    }

    return this.prisma.listing.update({
      where: { id: listingId },
      data: {
        categoryId: input.categoryId,
        title: input.title,
        description: input.description,
        attributes: input.attributes as Prisma.InputJsonValue | undefined,
        price: input.price,
        currency: input.currency,
        city: input.city,
        district: input.district,
        slug: input.title ? listingSlug(input.title, listingId) : undefined,
      },
      include: { category: true, images: true },
    });
  }

  async submit(userId: string, listingId: string) {
    const listing = await this.getOwnedDraft(userId, listingId);
    await this.payments.assertListingPaymentReady(listing);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.listing.update({
        where: { id: listingId },
        data: { status: ListingStatus.PENDING },
        include: { category: true, images: true },
      });

      await this.outbox.write(tx, {
        aggregateType: 'Listing',
        aggregateId: listingId,
        eventType: 'listing.submitted',
        payload: { listingId, userId, categoryId: listing.categoryId },
      });

      return updated;
    });
  }

  async findMine(userId: string) {
    return this.prisma.listing.findMany({
      where: { userId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      include: { category: true, images: { where: { deletedAt: null } } },
    });
  }

  async findById(listingId: string, userId?: string) {
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, deletedAt: null },
      include: {
        category: true,
        images: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
        user: { select: { id: true, email: true } },
      },
    });

    if (!listing) throw new NotFoundException('İlan bulunamadı');

    const isOwner = userId === listing.userId;
    const isApproved = listing.status === ListingStatus.APPROVED;

    if (!isApproved && !isOwner) {
      throw new NotFoundException('İlan bulunamadı');
    }

    return listing;
  }

  async findBySlug(slug: string, userId?: string) {
    const listing = await this.prisma.listing.findFirst({
      where: { slug, deletedAt: null },
      include: {
        category: true,
        images: { where: { deletedAt: null, status: 'PUBLISHED' }, orderBy: { sortOrder: 'asc' } },
        user: { select: { id: true, email: true, phoneVerifiedAt: true, createdAt: true } },
      },
    });

    if (!listing) throw new NotFoundException('İlan bulunamadı');

    const isOwner = userId === listing.userId;
    if (listing.status !== ListingStatus.APPROVED && !isOwner) {
      throw new NotFoundException('İlan bulunamadı');
    }

    return listing;
  }

  async browse(params: SearchListingsInput) {
    const where: Prisma.ListingWhereInput = {
      status: ListingStatus.APPROVED,
      deletedAt: null,
      ...(params.city ? { city: params.city } : {}),
      ...(params.categorySlug
        ? { category: { slug: params.categorySlug, deletedAt: null } }
        : {}),
      ...(params.minPrice !== undefined || params.maxPrice !== undefined
        ? {
            price: {
              ...(params.minPrice !== undefined ? { gte: params.minPrice } : {}),
              ...(params.maxPrice !== undefined ? { lte: params.maxPrice } : {}),
            },
          }
        : {}),
      ...(params.q
        ? {
            OR: [
              { title: { contains: params.q, mode: 'insensitive' } },
              { description: { contains: params.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.ListingOrderByWithRelationInput | Prisma.ListingOrderByWithRelationInput[] =
      params.sort === 'price_asc'
        ? { price: 'asc' }
        : params.sort === 'price_desc'
          ? { price: 'desc' }
          : params.sort === 'promoted'
            ? [{ pricingTier: 'desc' }, { publishedAt: 'desc' }]
            : { publishedAt: 'desc' };

    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        orderBy,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        include: {
          category: true,
          images: {
            where: { deletedAt: null, status: 'PUBLISHED' },
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
        },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return {
      items: items.map((l) => this.toListingCard(l)),
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  toListingCard(listing: {
    id: string;
    slug: string;
    title: string;
    price: Prisma.Decimal | null;
    currency: string;
    city: string | null;
    district: string | null;
    publishedAt: Date | null;
    pricingTier?: string;
    category: { slug: string; name: string };
    images?: Array<{ publicKey: string | null }>;
  }) {
    const tier = listing.pricingTier ?? 'FREE';
    return {
      id: listing.id,
      slug: listing.slug,
      title: listing.title,
      price: listing.price ? Number(listing.price) : null,
      currency: listing.currency,
      city: listing.city,
      district: listing.district,
      publishedAt: listing.publishedAt?.toISOString() ?? null,
      category: { slug: listing.category.slug, name: listing.category.name },
      imageUrl: listing.images?.[0]?.publicKey
        ? `/media/${listing.images[0].publicKey}`
        : null,
      pricingTier: tier,
      isPromoted: tier !== 'FREE',
    };
  }

  async uploadImage(userId: string, listingId: string, file: Express.Multer.File) {
    const listing = await this.getOwnedDraft(userId, listingId);

    if (!file?.buffer?.length) {
      throw new BadRequestException('Dosya gerekli');
    }

    if (file.size > MAX_IMAGE_SIZE) {
      throw new BadRequestException('Dosya 10MB sınırını aşıyor');
    }

    const detected = await fileType.fromBuffer(file.buffer);
    if (!detected || !ALLOWED_IMAGE_TYPES.has(detected.mime)) {
      throw new BadRequestException('Geçersiz görsel formatı');
    }

    const imageId = randomUUID();
    const quarantineKey = `listings/${listingId}/${imageId}`;

    await this.storage.uploadQuarantine(quarantineKey, file.buffer, detected.mime);

    const image = await this.prisma.$transaction(async (tx) => {
      const created = await tx.listingImage.create({
        data: {
          id: imageId,
          listingId,
          quarantineKey,
          mimeType: detected.mime,
          sortOrder: listing.images?.length ?? 0,
        },
      });

      await this.outbox.write(tx, {
        aggregateType: 'ListingImage',
        aggregateId: imageId,
        eventType: 'listing.image.queued',
        payload: { imageId, listingId, quarantineKey },
      });

      return created;
    });

    return image;
  }

  private async getOwnedDraft(userId: string, listingId: string) {
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, userId, deletedAt: null },
      include: { images: { where: { deletedAt: null } } },
    });

    if (!listing) throw new NotFoundException('İlan bulunamadı');
    if (listing.status !== ListingStatus.DRAFT) {
      throw new ForbiddenException('Yalnızca taslak ilanlar düzenlenebilir');
    }

    return listing;
  }
}
