type Translator = (key: string) => string;

const CATEGORY_SLUGS = ['vasita', 'emlak', 'elektronik', 'is', 'hizmet', 'mobilya'] as const;

const ATTRIBUTE_KEYS = [
  'year',
  'brand',
  'mileage',
  'roomCount',
  'sqm',
  'listingType',
  'condition',
] as const;

const ATTRIBUTE_OPTION_KEYS = ['satilik', 'kiralik', 'sifir', 'ikinci-el'] as const;

export function translateCategory(slug: string, t: Translator, fallback?: string): string {
  if ((CATEGORY_SLUGS as readonly string[]).includes(slug)) {
    return t(`catalog.categories.${slug}`);
  }
  return fallback ?? slug;
}

export function translateListingStatus(status: string, t: Translator): string {
  const key = `catalog.listingStatus.${status}`;
  try {
    const translated = t(key);
    return translated === key ? status : translated;
  } catch {
    return status;
  }
}

export function translatePricingTier(tier: string, t: Translator): string {
  const key = `catalog.pricingTier.${tier}`;
  try {
    const translated = t(key);
    return translated === key ? tier : translated;
  } catch {
    return tier;
  }
}

export function translateAttributeLabel(key: string, t: Translator, fallback?: string): string {
  if ((ATTRIBUTE_KEYS as readonly string[]).includes(key)) {
    return t(`catalog.attributes.${key}`);
  }
  return fallback ?? key;
}

export function translateAttributeOption(option: string, t: Translator): string {
  if ((ATTRIBUTE_OPTION_KEYS as readonly string[]).includes(option)) {
    return t(`catalog.attributeOptions.${option}`);
  }
  return option;
}

export function promotedBadgeLabel(tier: string | undefined, t: Translator): string | null {
  if (!tier || tier === 'FREE') return null;
  const key = `catalog.promotedBadge.${tier}`;
  const label = t(key);
  if (label !== key) return label;
  return t('catalog.promotedBadge.default');
}
