import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { CreateCategoryInput, UpdateCategoryInput } from '@turkiye-pazaryeri/types';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { children: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } } },
    });
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findFirst({
      where: { slug, deletedAt: null },
      include: { children: { where: { deletedAt: null } } },
    });
    if (!category) throw new NotFoundException('Kategori bulunamadı');
    return category;
  }

  async create(input: CreateCategoryInput) {
    try {
      return await this.prisma.category.create({
        data: {
          slug: input.slug,
          name: input.name,
          nameEn: input.nameEn,
          parentId: input.parentId,
          sortOrder: input.sortOrder ?? 0,
          attributeSchema: (input.attributeSchema ?? { fields: {} }) as Prisma.InputJsonValue,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Bu slug zaten kullanılıyor');
      }
      throw e;
    }
  }

  async update(id: string, input: UpdateCategoryInput) {
    await this.findById(id);
    return this.prisma.category.update({
      where: { id },
      data: {
        slug: input.slug,
        name: input.name,
        nameEn: input.nameEn,
        parentId: input.parentId,
        sortOrder: input.sortOrder,
        attributeSchema: input.attributeSchema as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async softDelete(id: string) {
    await this.findById(id);
    return this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findById(id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null },
    });
    if (!category) throw new NotFoundException('Kategori bulunamadı');
    return category;
  }
}
