import { z } from 'zod';

export const searchListingsSchema = z.object({
  q: z.string().optional(),
  categorySlug: z.string().optional(),
  city: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'promoted']).default('newest'),
});

export type SearchListingsInput = z.infer<typeof searchListingsSchema>;

export interface ListingCard {
  id: string;
  slug: string;
  title: string;
  price: number | null;
  currency: string;
  city: string | null;
  district: string | null;
  publishedAt: string | null;
  category: { slug: string; name: string };
  imageUrl: string | null;
  pricingTier?: string;
  isPromoted?: boolean;
}

export interface PaginatedListings {
  items: ListingCard[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
