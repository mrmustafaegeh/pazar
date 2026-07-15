import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ListingStatus, ModerationActionType } from '@prisma/client';
import type { RejectListingInput } from '@turkiye-pazaryeri/types';
import { PrismaService } from '../../database/prisma.service';
import { OutboxService } from '../outbox/outbox.service';

@Injectable()
export class ModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
  ) {}

  async getQueue(limit = 50, offset = 0) {
    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where: { status: ListingStatus.PENDING, deletedAt: null },
        orderBy: { createdAt: 'asc' },
        take: limit,
        skip: offset,
        include: {
          category: true,
          user: { select: { id: true, email: true, phone: true } },
          images: { where: { deletedAt: null } },
        },
      }),
      this.prisma.listing.count({
        where: { status: ListingStatus.PENDING, deletedAt: null },
      }),
    ]);

    return { items, total, limit, offset };
  }

  async approve(moderatorId: string, listingId: string) {
    const listing = await this.getPendingListing(listingId);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.listing.update({
        where: { id: listingId },
        data: {
          status: ListingStatus.APPROVED,
          publishedAt: new Date(),
        },
        include: { category: true, images: true },
      });

      await tx.moderationAction.create({
        data: {
          listingId,
          moderatorId,
          action: ModerationActionType.APPROVE,
        },
      });

      await this.outbox.write(tx, {
        aggregateType: 'Listing',
        aggregateId: listingId,
        eventType: 'listing.approved',
        payload: {
          listingId,
          moderatorId,
          categoryId: listing.categoryId,
          userId: listing.userId,
        },
      });

      return updated;
    });
  }

  async reject(moderatorId: string, listingId: string, input: RejectListingInput) {
    const listing = await this.getPendingListing(listingId);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.listing.update({
        where: { id: listingId },
        data: { status: ListingStatus.REJECTED },
        include: { category: true, images: true },
      });

      await tx.moderationAction.create({
        data: {
          listingId,
          moderatorId,
          action: ModerationActionType.REJECT,
          reason: input.reason,
        },
      });

      await this.outbox.write(tx, {
        aggregateType: 'Listing',
        aggregateId: listingId,
        eventType: 'listing.rejected',
        payload: {
          listingId,
          moderatorId,
          reason: input.reason,
          userId: listing.userId,
        },
      });

      return updated;
    });
  }

  async getHistory(listingId: string) {
    return this.prisma.moderationAction.findMany({
      where: { listingId },
      orderBy: { createdAt: 'desc' },
      include: { moderator: { select: { id: true, email: true } } },
    });
  }

  private async getPendingListing(listingId: string) {
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, status: ListingStatus.PENDING, deletedAt: null },
    });

    if (!listing) {
      throw new NotFoundException('Bekleyen ilan bulunamadı');
    }

    return listing;
  }
}
