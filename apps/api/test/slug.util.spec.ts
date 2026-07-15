import { listingSlug, slugify } from '../src/common/utils/slug.util';

describe('slugify', () => {
  it('transliterates Turkish characters', () => {
    expect(slugify('İstanbul Satılık Daire')).toBe('istanbul-satilik-daire');
    expect(slugify('Şehir Merkezi Öğrenci Evi')).toBe('sehir-merkezi-ogrenci-evi');
  });

  it('builds unique listing slugs', () => {
    const slug = listingSlug('BMW 320i', 'clxyz1234567890');
    expect(slug).toMatch(/^bmw-320i-[a-z0-9]+$/);
  });
});
