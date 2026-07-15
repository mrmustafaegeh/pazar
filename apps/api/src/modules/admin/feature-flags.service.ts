import { Injectable, NotFoundException } from '@nestjs/common';
import type { UpdateFeatureFlagInput } from '@turkiye-pazaryeri/types';
import { PrismaService } from '../../database/prisma.service';
import { AdminAuditService } from './admin-audit.service';

@Injectable()
export class FeatureFlagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
  ) {}

  async findAll() {
    return this.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
  }

  async update(adminId: string, key: string, input: UpdateFeatureFlagInput) {
    const flag = await this.prisma.featureFlag.findUnique({ where: { key } });
    if (!flag) throw new NotFoundException('Özellik bayrağı bulunamadı');

    const updated = await this.prisma.featureFlag.update({
      where: { key },
      data: { enabled: input.enabled },
    });

    await this.audit.log(adminId, 'feature_flag.update', 'FeatureFlag', key, input.justification, {
      previousEnabled: flag.enabled,
      newEnabled: input.enabled,
    });

    return updated;
  }
}
