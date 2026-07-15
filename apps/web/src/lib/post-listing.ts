export { CATEGORY_IMAGES } from '@/lib/categoryImages';

export const POST_LISTING_STEP_KEYS = [
  'category',
  'details',
  'images',
  'priceLocation',
  'review',
] as const;

export type PostListingStepKey = (typeof POST_LISTING_STEP_KEYS)[number];

export const DESCRIPTION_MAX = 10000;
export const TITLE_MIN = 3;
export const DESCRIPTION_MIN = 10;

export function formatPriceInput(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('en-US');
}

export function parsePriceInput(value: string): string {
  return value.replace(/\D/g, '');
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
