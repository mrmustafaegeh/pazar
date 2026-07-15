import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    adminId: string,
    action: string,
    targetType: string,
    targetId: string,
    justification: string,
    metadata: Record<string, unknown> = {},
  ) {
    return this.prisma.adminAuditLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId,
        justification,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
  }

  async list(limit = 50, offset = 0) {
    const [items, total] = await Promise.all([
      this.prisma.adminAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: { admin: { select: { id: true, email: true } } },
      }),
      this.prisma.adminAuditLog.count(),
    ]);

    return { items, total, limit, offset };
  }
}
