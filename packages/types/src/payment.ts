import { z } from 'zod';

export const pricingTierSchema = z.enum(['FREE', 'STANDARD', 'PREMIUM', 'DEALER']);

export const createCheckoutSchema = z.object({
  listingId: z.string().cuid(),
  pricingTier: pricingTierSchema.refine((t) => t !== 'FREE', {
    message: 'Ücretsiz paket için ödeme gerekmez',
  }),
  idempotencyKey: z.string().min(8).max(128),
});

export const paymentWebhookSchema = z.object({
  idempotencyKey: z.string().min(8),
  providerRef: z.string().min(1),
  status: z.enum(['COMPLETED', 'FAILED']),
});

export type PricingTier = z.infer<typeof pricingTierSchema>;
export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
export type PaymentWebhookInput = z.infer<typeof paymentWebhookSchema>;

export interface PricingPlan {
  tier: PricingTier;
  name: string;
  description: string;
  price: number;
  currency: string;
  durationDays: number;
  features: string[];
}
