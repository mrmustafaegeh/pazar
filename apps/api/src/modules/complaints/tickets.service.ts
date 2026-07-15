import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TicketStatus, TicketType } from '@prisma/client';
import type {
  CreateTicketInput,
  ReportListingInput,
  ReportUserInput,
  TicketsQuery,
  UpdateTicketInput,
} from '@turkiye-pazaryeri/types';
import { PrismaService } from '../../database/prisma.service';
import { AdminAuditService } from '../admin/admin-audit.service';
import { OutboxService } from '../outbox/outbox.service';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
    private readonly outbox: OutboxService,
  ) {}

  async create(creatorId: string, input: CreateTicketInput) {
    if (input.listingId) {
      const listing = await this.prisma.listing.findFirst({
        where: { id: input.listingId, deletedAt: null, status: 'APPROVED' },
      });
      if (!listing) throw new NotFoundException('İlan bulunamadı');
    }

    if (input.reportedUserId) {
      if (input.reportedUserId === creatorId) {
        throw new BadRequestException('Kendinizi şikayet edemezsiniz');
      }
      const reported = await this.prisma.user.findFirst({
        where: { id: input.reportedUserId, deletedAt: null },
      });
      if (!reported) throw new NotFoundException('Kullanıcı bulunamadı');
    }

    const priority = input.type === TicketType.DATA_REQUEST ? 'URGENT' : (input.priority ?? 'MEDIUM');

    const ticket = await this.prisma.$transaction(async (tx) => {
      const created = await tx.ticket.create({
        data: {
          type: input.type,
          subject: input.subject,
          body: input.body,
          priority,
          creatorId,
          listingId: input.listingId,
          reportedUserId: input.reportedUserId,
          slaDeadline:
            input.type === TicketType.DATA_REQUEST
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              : undefined,
        },
        include: {
          creator: { select: { id: true, email: true } },
        },
      });

      await this.outbox.write(tx, {
        aggregateType: 'Ticket',
        aggregateId: created.id,
        eventType: 'ticket.created',
        payload: {
          ticketId: created.id,
          type: created.type,
          subject: created.subject,
          creatorId,
          creatorEmail: created.creator.email,
        },
      });

      return created;
    });

    return ticket;
  }

  async reportListing(creatorId: string, input: ReportListingInput) {
    return this.create(creatorId, {
      type: 'LISTING_REPORT',
      subject: 'İlan şikayeti',
      body: input.reason,
      listingId: input.listingId,
      priority: 'HIGH',
    });
  }

  async reportUser(creatorId: string, input: ReportUserInput) {
    return this.create(creatorId, {
      type: 'USER_COMPLAINT',
      subject: 'Kullanıcı şikayeti',
      body: input.reason,
      reportedUserId: input.reportedUserId,
      priority: 'HIGH',
    });
  }

  async listMine(creatorId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { creatorId, deletedAt: null };

    const [items, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
        select: {
          id: true,
          type: true,
          status: true,
          priority: true,
          subject: true,
          createdAt: true,
          resolvedAt: true,
        },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return { items, total, page, totalPages: Math.ceil(total / limit) };
  }

  async list(query: TicketsQuery) {
    const where = {
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
    };

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        take: query.limit,
        skip,
        include: {
          creator: { select: { id: true, email: true } },
          assignee: { select: { id: true, email: true } },
          listing: { select: { id: true, title: true, slug: true } },
        },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return { items, total, page: query.page, totalPages: Math.ceil(total / query.limit) };
  }

  async findById(id: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id, deletedAt: null },
      include: {
        creator: { select: { id: true, email: true, phone: true } },
        assignee: { select: { id: true, email: true } },
        listing: { select: { id: true, title: true, slug: true } },
        reportedUser: { select: { id: true, email: true } },
      },
    });

    if (!ticket) throw new NotFoundException('Destek talebi bulunamadı');
    return ticket;
  }

  async update(adminId: string, id: string, input: UpdateTicketInput) {
    const ticket = await this.findById(id);

    if (input.assigneeId) {
      const assignee = await this.prisma.user.findFirst({
        where: { id: input.assigneeId, deletedAt: null },
      });
      if (!assignee) throw new NotFoundException('Atanan kullanıcı bulunamadı');
    }

    const resolvedAt =
      input.status === TicketStatus.RESOLVED || input.status === TicketStatus.CLOSED
        ? new Date()
        : undefined;

    const metadata = ticket.metadata as Record<string, unknown> | null;
    const isErasureRequest =
      ticket.type === TicketType.DATA_REQUEST && metadata?.requestType === 'erasure';

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.ticket.update({
        where: { id },
        data: {
          status: input.status,
          priority: input.priority,
          assigneeId: input.assigneeId,
          resolvedAt,
        },
        include: {
          creator: { select: { id: true, email: true } },
          assignee: { select: { id: true, email: true } },
        },
      });

      await this.audit.log(adminId, 'ticket.update', 'Ticket', id, input.justification, {
        previousStatus: ticket.status,
        newStatus: row.status,
      });

      await this.outbox.write(tx, {
        aggregateType: 'Ticket',
        aggregateId: id,
        eventType: 'ticket.updated',
        payload: {
          ticketId: id,
          status: row.status,
          creatorId: row.creator.id,
          creatorEmail: row.creator.email,
        },
      });

      if (isErasureRequest && input.status === TicketStatus.RESOLVED) {
        await this.outbox.write(tx, {
          aggregateType: 'User',
          aggregateId: ticket.creatorId,
          eventType: 'kvkk.erasure.approved',
          payload: {
            userId: ticket.creatorId,
            ticketId: id,
            adminId,
          },
        });
      }

      return row;
    });

    return updated;
  }

  async assertSupportAccess(userId: string, ticketId: string) {
    const ticket = await this.findById(ticketId);
    if (ticket.creatorId !== userId) {
      throw new ForbiddenException('Bu talebe erişim yetkiniz yok');
    }
    return ticket;
  }
}
