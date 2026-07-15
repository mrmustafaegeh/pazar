import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import type {
  AdminUsersQuery,
  SuspendUserInput,
  UpdateUserRolesInput,
} from '@turkiye-pazaryeri/types';
import { PrismaService } from '../../database/prisma.service';
import { AdminAuditService } from './admin-audit.service';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
  ) {}

  async list(query: AdminUsersQuery) {
    const where = {
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { email: { contains: query.search, mode: 'insensitive' as const } },
              { phone: { contains: query.search } },
            ],
          }
        : {}),
    };

    const skip = (query.page - 1) * query.limit;
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip,
        select: {
          id: true,
          email: true,
          phone: true,
          phoneVerifiedAt: true,
          roles: true,
          totpEnabled: true,
          createdAt: true,
          _count: { select: { listings: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map((u) => ({
        id: u.id,
        email: u.email,
        phone: u.phone,
        phoneVerified: Boolean(u.phoneVerifiedAt),
        roles: u.roles,
        totpEnabled: u.totpEnabled,
        createdAt: u.createdAt,
        listingCount: u._count.listings,
      })),
      total,
      page: query.page,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        phone: true,
        phoneVerifiedAt: true,
        roles: true,
        totpEnabled: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { listings: true, ticketsCreated: true } },
      },
    });

    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      phoneVerified: Boolean(user.phoneVerifiedAt),
      roles: user.roles,
      totpEnabled: user.totpEnabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      listingCount: user._count.listings,
      ticketCount: user._count.ticketsCreated,
    };
  }

  async updateRoles(adminId: string, userId: string, input: UpdateUserRolesInput) {
    if (userId === adminId) {
      throw new BadRequestException('Kendi rollerinizi değiştiremezsiniz');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { roles: input.roles as Role[] },
      select: {
        id: true,
        email: true,
        roles: true,
      },
    });

    await this.audit.log(adminId, 'user.roles.update', 'User', userId, input.justification, {
      previousRoles: user.roles,
      newRoles: input.roles,
    });

    return updated;
  }

  async suspend(adminId: string, userId: string, input: SuspendUserInput) {
    if (userId === adminId) {
      throw new ForbiddenException('Kendi hesabınızı askıya alamazsınız');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

    if (user.roles.includes(Role.SUPER_ADMIN)) {
      throw new ForbiddenException('Süper admin hesabı askıya alınamaz');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });

    await this.audit.log(adminId, 'user.suspend', 'User', userId, input.justification);

    return { success: true };
  }
}
