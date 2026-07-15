/** Verified Unsplash fallbacks for category / listing placeholders (w=800). */
export const CATEGORY_IMAGES: Record<string, string> = {
  vasita:
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80&auto=format&fit=crop',
  emlak:
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80&auto=format&fit=crop',
  elektronik:
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80&auto=format&fit=crop',
  is: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80&auto=format&fit=crop',
  hizmet:
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80&auto=format&fit=crop',
  mobilya:
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80&auto=format&fit=crop',
};

export function categoryImage(slug: string): string {
  return CATEGORY_IMAGES[slug] ?? CATEGORY_IMAGES.elektronik;
}
