import { Injectable, NotFoundException } from '@nestjs/common';
import { ListingStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        createdAt: true,
        phoneVerifiedAt: true,
      },
    });

    if (!user) throw new NotFoundException('Kullanıcı bulunamadı');

    const [listingCount, listings] = await Promise.all([
      this.prisma.listing.count({
        where: { userId, status: ListingStatus.APPROVED, deletedAt: null },
      }),
      this.prisma.listing.findMany({
        where: { userId, status: ListingStatus.APPROVED, deletedAt: null },
        orderBy: { publishedAt: 'desc' },
        take: 12,
        include: {
          category: true,
          images: {
            where: { deletedAt: null, status: 'PUBLISHED' },
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
        },
      }),
    ]);

    return {
      id: user.id,
      memberSince: user.createdAt.toISOString(),
      phoneVerified: !!user.phoneVerifiedAt,
      listingCount,
      listings: listings.map((l) => ({
        id: l.id,
        slug: l.slug,
        title: l.title,
        price: l.price ? Number(l.price) : null,
        currency: l.currency,
        city: l.city,
        category: { slug: l.category.slug, name: l.category.name },
        imageUrl: l.images[0]?.publicKey ? `/media/${l.images[0].publicKey}` : null,
      })),
    };
  }
}
