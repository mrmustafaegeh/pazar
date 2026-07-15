import { Injectable, Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { ListingStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { SearchService } from '../modules/search/search.service';
import { TIER_RANK } from '../modules/payments/pricing.config';
import type { PricingTier } from '@turkiye-pazaryeri/types';
import { QUEUE_NAMES } from './queues';

interface SearchIndexJobData {
  listingId: string;
  eventType: string;
}

@Injectable()
export class SearchIndexProcessor {
  private readonly logger = new Logger(SearchIndexProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly search: SearchService,
  ) {}

  createWorker(connection: { host: string; port: number; password?: string }): Worker {
    return new Worker<SearchIndexJobData>(
      QUEUE_NAMES.SEARCH_INDEX,
      async (job) => this.process(job),
      { connection, concurrency: 5 },
    );
  }

  async process(job: Job<SearchIndexJobData>): Promise<void> {
    const { listingId, eventType } = job.data;

    if (eventType === 'listing.rejected') {
      await this.search.removeListing(listingId);
      return;
    }

    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, status: ListingStatus.APPROVED, deletedAt: null },
      include: { category: true },
    });

    if (!listing) {
      await this.search.removeListing(listingId);
      return;
    }

    await this.search.indexListing({
      id: listing.id,
      slug: listing.slug,
      title: listing.title,
      description: listing.description,
      categoryId: listing.categoryId,
      categorySlug: listing.category.slug,
      categoryName: listing.category.name,
      city: listing.city,
      district: listing.district,
      price: listing.price ? Number(listing.price) : null,
      currency: listing.currency,
      attributes: listing.attributes as Record<string, unknown>,
      publishedAt: listing.publishedAt?.toISOString() ?? null,
      pricingTier: listing.pricingTier,
      tierRank: TIER_RANK[listing.pricingTier as PricingTier] ?? 0,
    });

    this.logger.log(`Indexed listing ${listingId}`);
  }
}
