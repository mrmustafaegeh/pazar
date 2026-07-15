import type { ListingDetail } from './api';
import { mediaUrl } from './api';

export function listingJsonLd(listing: ListingDetail, siteUrl: string) {
  const images = listing.images
    .map((i) => mediaUrl(i.publicKey ? `/media/${i.publicKey}` : null))
    .filter(Boolean);

  const isRealEstate = listing.category.slug === 'emlak';

  if (isRealEstate) {
    return {
      '@context': 'https://schema.org',
      '@type': 'RealEstateListing',
      name: listing.title,
      description: listing.description,
      url: `${siteUrl}/ilan/${listing.slug}`,
      image: images,
      offers: listing.price
        ? {
            '@type': 'Offer',
            price: listing.price,
            priceCurrency: listing.currency,
          }
        : undefined,
    };
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.title,
    description: listing.description,
    url: `${siteUrl}/ilan/${listing.slug}`,
    image: images,
    offers: listing.price
      ? {
          '@type': 'Offer',
          price: listing.price,
          priceCurrency: listing.currency,
          availability: 'https://schema.org/InStock',
        }
      : undefined,
  };
}
