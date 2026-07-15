import { Injectable } from '@nestjs/common';
import { ListingStatus, TicketStatus } from '@prisma/client';
import type { AdminAnalytics } from '@turkiye-pazaryeri/types';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(): Promise<AdminAnalytics> {
    const [
      totalUsers,
      verifiedUsers,
      listingCounts,
      openTickets,
      inProgressTickets,
      totalTickets,
      pendingModeration,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null, phoneVerifiedAt: { not: null } } }),
      this.prisma.listing.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.ticket.count({ where: { deletedAt: null, status: TicketStatus.OPEN } }),
      this.prisma.ticket.count({ where: { deletedAt: null, status: TicketStatus.IN_PROGRESS } }),
      this.prisma.ticket.count({ where: { deletedAt: null } }),
      this.prisma.listing.count({
        where: { deletedAt: null, status: ListingStatus.PENDING },
      }),
    ]);

    const listings: Record<string, number> = {};
    for (const row of listingCounts) {
      listings[row.status] = row._count._all;
    }

    return {
      users: { total: totalUsers, verified: verifiedUsers },
      listings,
      tickets: { open: openTickets, inProgress: inProgressTickets, total: totalTickets },
      moderation: { pending: pendingModeration },
    };
  }
}
