import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@opensearch-project/opensearch';

export interface ListingSearchDocument {
  id: string;
  slug: string;
  title: string;
  description: string;
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  city: string | null;
  district: string | null;
  price: number | null;
  currency: string;
  attributes: Record<string, unknown>;
  publishedAt: string | null;
  pricingTier: string;
  tierRank: number;
}

@Injectable()
export class SearchService implements OnModuleInit {
  private client: Client | null = null;
  private readonly logger = new Logger(SearchService.name);
  readonly indexName = 'listings';

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    try {
      this.client = new Client({ node: this.config.getOrThrow('OPENSEARCH_URL') });
      await this.ensureIndex();
    } catch {
      this.logger.warn('OpenSearch unavailable — search will fall back to database');
      this.client = null;
    }
  }

  private getClient(): Client {
    if (!this.client) throw new Error('OpenSearch unavailable');
    return this.client;
  }

  async ensureIndex() {
    const client = this.getClient();
    const exists = await client.indices.exists({ index: this.indexName });
    if (exists.body) return;

    await client.indices.create({
      index: this.indexName,
      body: {
        settings: {
          analysis: {
            analyzer: {
              turkish: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'turkish_stop', 'turkish_stemmer'],
              },
            },
            filter: {
              turkish_stop: { type: 'stop', stopwords: '_turkish_' },
              turkish_stemmer: { type: 'stemmer', language: 'turkish' },
            },
          },
        },
        mappings: {
          properties: {
            title: { type: 'text', analyzer: 'turkish' },
            description: { type: 'text', analyzer: 'turkish' },
            slug: { type: 'keyword' },
            categorySlug: { type: 'keyword' },
            categoryName: { type: 'text', analyzer: 'turkish' },
            city: { type: 'keyword' },
            district: { type: 'keyword' },
            price: { type: 'float' },
            currency: { type: 'keyword' },
            publishedAt: { type: 'date' },
            pricingTier: { type: 'keyword' },
            tierRank: { type: 'integer' },
            attributes: { type: 'object', enabled: true },
          },
        },
      },
    });
  }

  async indexListing(doc: ListingSearchDocument) {
    await this.getClient().index({
      index: this.indexName,
      id: doc.id,
      body: doc,
      refresh: true,
    });
  }

  async removeListing(id: string) {
    if (!this.client) return;
    try {
      await this.client.delete({ index: this.indexName, id });
    } catch {
      // ignore not found
    }
  }

  async search(params: {
    q?: string;
    categorySlug?: string;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    page: number;
    limit: number;
    sort: string;
  }) {
    const from = (params.page - 1) * params.limit;
    const must: Record<string, unknown>[] = [];

    if (params.q) {
      must.push({
        multi_match: {
          query: params.q,
          fields: ['title^3', 'description', 'categoryName'],
          analyzer: 'turkish',
        },
      });
    }

    if (params.categorySlug) {
      must.push({ term: { categorySlug: params.categorySlug } });
    }

    if (params.city) {
      must.push({ term: { city: params.city } });
    }

    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      const range: Record<string, number> = {};
      if (params.minPrice !== undefined) range.gte = params.minPrice;
      if (params.maxPrice !== undefined) range.lte = params.maxPrice;
      must.push({ range: { price: range } });
    }

    const sortMap: Record<string, unknown[]> = {
      newest: [{ publishedAt: 'desc' }],
      price_asc: [{ price: 'asc' }],
      price_desc: [{ price: 'desc' }],
      promoted: [{ tierRank: 'desc' }, { publishedAt: 'desc' }],
    };

    const result = await this.getClient().search({
      index: this.indexName,
      body: {
        from,
        size: params.limit,
        query: must.length ? { bool: { must } } : { match_all: {} },
        sort: sortMap[params.sort] ?? sortMap.newest,
      },
    });

    const hits = result.body.hits;
    const items = (hits.hits as Array<{ _id: string; _source: ListingSearchDocument }>).map(
      (h) => ({
        id: h._id,
        slug: h._source.slug,
        title: h._source.title,
        price: h._source.price,
        currency: h._source.currency,
        city: h._source.city,
        district: h._source.district,
        publishedAt: h._source.publishedAt,
        category: { slug: h._source.categorySlug, name: h._source.categoryName },
        imageUrl: null,
        pricingTier: h._source.pricingTier ?? 'FREE',
        isPromoted: (h._source.tierRank ?? 0) > 0,
      }),
    );

    const total = typeof hits.total === 'number' ? hits.total : hits.total?.value ?? 0;

    return {
      items,
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil(total / params.limit),
    };
  }
}
