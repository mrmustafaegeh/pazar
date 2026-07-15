import * as argon2 from 'argon2';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TicketStatus, TicketType } from '@prisma/client';
import type { KvkkDeletionInput } from '@turkiye-pazaryeri/types';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../../database/prisma.service';
import { OutboxService } from '../outbox/outbox.service';
import { AdminAuditService } from '../admin/admin-audit.service';

export interface KvkkJobData {
  action: 'export' | 'erasure';
  userId: string;
  ticketId?: string;
  adminId?: string;
}

@Injectable()
export class KvkkService {
  private readonly logger = new Logger(KvkkService.name);
  private readonly exportDir = join(process.cwd(), '.kvkk-exports');

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    private readonly audit: AdminAuditService,
  ) {}

  async requestDataExport(userId: string) {
    const user = await this.requireUser(userId);

    const ticket = await this.prisma.$transaction(async (tx) => {
      const created = await tx.ticket.create({
        data: {
          type: TicketType.DATA_REQUEST,
          subject: 'KVKK veri dışa aktarma talebi',
          body: 'Kullanıcı kişisel verilerinin dışa aktarılmasını talep etti.',
          creatorId: userId,
          priority: 'URGENT',
          slaDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
          creatorId: userId,
          creatorEmail: user.email,
        },
      });

      await this.outbox.write(tx, {
        aggregateType: 'Ticket',
        aggregateId: created.id,
        eventType: 'kvkk.export.requested',
        payload: { userId, ticketId: created.id },
      });

      return created;
    });

    return { ticketId: ticket.id, status: 'queued' };
  }

  async requestDeletion(userId: string, input: KvkkDeletionInput) {
    await this.requireUser(userId);

    const ticket = await this.prisma.$transaction(async (tx) => {
      const created = await tx.ticket.create({
        data: {
          type: TicketType.DATA_REQUEST,
          subject: 'KVKK hesap silme talebi',
          body: input.reason ?? 'Kullanıcı hesabının ve kişisel verilerinin silinmesini talep etti.',
          creatorId: userId,
          priority: 'URGENT',
          metadata: { requestType: 'erasure' },
          slaDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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
          creatorId: userId,
        },
      });

      return created;
    });

    return { ticketId: ticket.id, status: 'pending_review' };
  }

  async processExport(userId: string, ticketId?: string) {
    const user = await this.requireUser(userId);
    const bundle = await this.buildExportBundle(userId);
    const exportKey = `export-${userId}-${Date.now()}.json`;

    await mkdir(this.exportDir, { recursive: true });
    await writeFile(join(this.exportDir, exportKey), JSON.stringify(bundle, null, 2), 'utf8');

    if (ticketId) {
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: TicketStatus.RESOLVED,
          resolvedAt: new Date(),
          metadata: { exportKey, exportedAt: new Date().toISOString() },
        },
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await this.outbox.write(tx, {
        aggregateType: 'User',
        aggregateId: userId,
        eventType: 'kvkk.export.ready',
        payload: { userId, email: user.email, exportKey, ticketId },
      });
    });

    this.logger.log(`KVKK export completed for ${userId}: ${exportKey}`);
    return { exportKey };
  }

  async processErasure(userId: string, adminId: string, ticketId?: string) {
    const user = await this.requireUser(userId);

    await this.prisma.$transaction(async (tx) => {
      await tx.listing.updateMany({
        where: { userId, deletedAt: null },
        data: { deletedAt: new Date(), status: 'REJECTED' },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          email: `deleted+${userId}@anonymized.local`,
          phone: null,
          passwordHash: await this.hashPlaceholder(),
          totpSecret: null,
          totpEnabled: false,
          deletedAt: new Date(),
        },
      });

      if (ticketId) {
        await tx.ticket.update({
          where: { id: ticketId },
          data: { status: TicketStatus.CLOSED, resolvedAt: new Date() },
        });
      }

      await this.audit.log(adminId, 'kvkk.erasure', 'User', userId, 'KVKK silme talebi işlendi');

      await this.outbox.write(tx, {
        aggregateType: 'User',
        aggregateId: userId,
        eventType: 'kvkk.erasure.completed',
        payload: { userId, email: user.email, ticketId },
      });
    });

    return { success: true };
  }

  async buildExportBundle(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        phoneVerifiedAt: true,
        roles: true,
        createdAt: true,
        updatedAt: true,
        listings: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            publishedAt: true,
          },
        },
        ticketsCreated: {
          where: { deletedAt: null },
          select: { id: true, type: true, subject: true, status: true, createdAt: true },
        },
        messagesSent: {
          select: { id: true, body: true, createdAt: true },
          take: 100,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

    return {
      exportedAt: new Date().toISOString(),
      user,
    };
  }

  private async requireUser(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, email: true },
    });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');
    return user;
  }

  private async hashPlaceholder() {
    return argon2.hash('deleted-account', { type: argon2.argon2id });
  }
}
