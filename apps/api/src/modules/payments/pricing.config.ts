import type { PricingPlan, PricingTier } from '@turkiye-pazaryeri/types';

export const TIER_PRICES_TRY: Record<PricingTier, number> = {
  FREE: 0,
  STANDARD: 99,
  PREMIUM: 249,
  DEALER: 999,
};

export const TIER_DURATION_DAYS: Record<PricingTier, number> = {
  FREE: 30,
  STANDARD: 30,
  PREMIUM: 30,
  DEALER: 30,
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    tier: 'FREE',
    name: 'Ücretsiz',
    description: 'Standart ilan listeleme',
    price: 0,
    currency: 'TRY',
    durationDays: 30,
    features: ['30 gün yayında', 'Standart sıralama'],
  },
  {
    tier: 'STANDARD',
    name: 'Standart',
    description: 'Daha fazla görünürlük',
    price: TIER_PRICES_TRY.STANDARD,
    currency: 'TRY',
    durationDays: 30,
    features: ['30 gün yayında', 'Arama sonuçlarında öncelik', 'Standart rozet'],
  },
  {
    tier: 'PREMIUM',
    name: 'Premium',
    description: 'Maksimum görünürlük',
    price: TIER_PRICES_TRY.PREMIUM,
    currency: 'TRY',
    durationDays: 30,
    features: ['30 gün yayında', 'Ana sayfada öne çıkan', 'Premium rozet', 'Üst sıralama'],
  },
  {
    tier: 'DEALER',
    name: 'Galeri / Bayi',
    description: 'Profesyonel satıcılar için',
    price: TIER_PRICES_TRY.DEALER,
    currency: 'TRY',
    durationDays: 30,
    features: ['30 gün yayında', 'Sınırsız ilan önceliği', 'Bayi rozeti', 'Öncelikli destek'],
  },
];

export function isPaidTier(tier: PricingTier): boolean {
  return tier !== 'FREE';
}

export const TIER_RANK: Record<PricingTier, number> = {
  FREE: 0,
  STANDARD: 1,
  PREMIUM: 2,
  DEALER: 3,
};
