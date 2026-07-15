import { z } from 'zod';

export const listingStatusSchema = z.enum([
  'DRAFT',
  'PENDING',
  'APPROVED',
  'REJECTED',
  'EXPIRED',
]);

export const createListingSchema = z.object({
  categoryId: z.string().cuid(),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(10000),
  attributes: z.record(z.unknown()).default({}),
  price: z.number().positive().optional(),
  currency: z.string().length(3).default('TRY'),
  city: z.string().optional(),
  district: z.string().optional(),
});

export const updateListingSchema = createListingSchema.partial();

export const rejectListingSchema = z.object({
  reason: z.string().min(3).max(1000),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type UpdateListingInput = z.infer<typeof updateListingSchema>;
export type RejectListingInput = z.infer<typeof rejectListingSchema>;
