import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface OutboxEventInput {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
}

@Injectable()
export class OutboxService {
  constructor(private readonly prisma: PrismaService) {}

  async write(
    tx: Prisma.TransactionClient,
    event: OutboxEventInput,
  ): Promise<void> {
    await tx.outbox.create({
      data: {
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        eventType: event.eventType,
        payload: event.payload as Prisma.InputJsonValue,
      },
    });
  }

  async getUndispatched(limit = 100) {
    return this.prisma.outbox.findMany({
      where: { dispatchedAt: null },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  async markDispatched(id: string): Promise<void> {
    await this.prisma.outbox.update({
      where: { id },
      data: { dispatchedAt: new Date() },
    });
  }
}
