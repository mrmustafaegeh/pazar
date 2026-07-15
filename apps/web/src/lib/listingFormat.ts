import type { DisplayCurrency } from '@/lib/currency';
import { convertToDisplayCurrency } from '@/lib/currency';
import { categoryImage } from '@/lib/categoryImages';

type RelativeTranslator = (key: string, values?: Record<string, string | number>) => string;

export function formatRelativeTime(
  iso: string | null,
  t: RelativeTranslator,
): string {
  if (!iso) return '';

  const published = new Date(iso);
  if (Number.isNaN(published.getTime())) return '';

  const diffMs = Date.now() - published.getTime();
  const days = Math.floor(diffMs / 86_400_000);

  if (days < 1) return t('listing.relative.today');
  if (days === 1) return t('listing.relative.oneDayAgo');
  if (days < 7) return t('listing.relative.daysAgo', { count: days });

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return t('listing.relative.weeksAgo', { count: weeks });

  const months = Math.floor(days / 30);
  return t('listing.relative.monthsAgo', { count: Math.max(months, 1) });
}

export function formatListingPrice(
  price: number | null,
  currency: string,
  locale: string,
  notSetLabel: string,
  displayCurrency?: DisplayCurrency,
): string {
  if (price == null) return notSetLabel;

  const target = displayCurrency ?? (currency as DisplayCurrency);
  const amount =
    displayCurrency && displayCurrency !== currency
      ? convertToDisplayCurrency(price, currency, displayCurrency)
      : price;

  const tag = locale === 'ar' ? 'ar-SA' : locale === 'en' ? 'en-US' : 'tr-TR';
  return `${target} ${amount.toLocaleString(tag)}`;
}


export function listingImageSrc(
  imageUrl: string | null,
  categorySlug: string,
  apiMediaUrl: (path: string | null) => string | null,
): string {
  const resolved = apiMediaUrl(imageUrl);
  if (resolved) return resolved;
  return categoryImage(categorySlug);
}

export function resolveListingImages(
  images: Array<{ publicKey: string | null }>,
  categorySlug: string,
  apiMediaUrl: (path: string | null) => string | null,
): string[] {
  const published = images
    .map((image) =>
      listingImageSrc(
        image.publicKey ? `/media/${image.publicKey}` : null,
        categorySlug,
        apiMediaUrl,
      ),
    )
    .filter(Boolean);

  if (published.length) return published;
  return [listingImageSrc(null, categorySlug, apiMediaUrl)];
}

type AttributeTranslator = (key: string) => string;

export function formatAttributeValue(
  key: string,
  value: unknown,
  t: AttributeTranslator,
): string {
  const raw = String(value);
  if (key === 'mileage') return `${Number(value).toLocaleString()} km`;
  if (key === 'sqm') return `${Number(value)} m²`;
  if (['condition', 'listingType', 'jobType'].includes(key)) {
    const translated = t(`catalog.attributeOptions.${raw}`);
    return translated === `catalog.attributeOptions.${raw}` ? raw : translated;
  }
  return raw;
}
