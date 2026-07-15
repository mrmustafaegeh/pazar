import { PrismaClient, Role, ListingStatus, PricingTier } from '@prisma/client';
import * as argon2 from 'argon2';
import { authenticator } from 'otplib';

const prisma = new PrismaClient();

const DEV_ADMIN_TOTP_SECRET = 'JBSWY3DPEHPK3PXP';

async function main() {
  const flags = [
    { key: 'registration_open', enabled: true, description: 'Allow new user registrations' },
    { key: 'payments_enabled', enabled: false, description: 'Enable paid promoted listings and checkout' },
  ];

  for (const flag of flags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {},
      create: flag,
    });
  }

  console.log('Seeded feature flags');

  const categories = [
    {
      slug: 'vasita',
      name: 'Vasıta',
      nameEn: 'Vehicles',
      attributeSchema: {
        fields: {
          year: { type: 'number', label: 'Yıl', required: true, minimum: 1950, maximum: 2030 },
          brand: { type: 'string', label: 'Marka', required: true },
          mileage: { type: 'number', label: 'Kilometre', required: true, minimum: 0 },
        },
      },
    },
    {
      slug: 'emlak',
      name: 'Emlak',
      nameEn: 'Real Estate',
      attributeSchema: {
        fields: {
          roomCount: { type: 'string', label: 'Oda sayısı', required: true },
          sqm: { type: 'number', label: 'Metrekare', required: true, minimum: 1 },
          listingType: {
            type: 'enum',
            label: 'İlan tipi',
            required: true,
            options: ['satilik', 'kiralik'],
          },
        },
      },
    },
    {
      slug: 'elektronik',
      name: 'Elektronik',
      nameEn: 'Electronics',
      attributeSchema: {
        fields: {
          brand: { type: 'string', label: 'Marka', required: true },
          condition: {
            type: 'enum',
            label: 'Durum',
            required: true,
            options: ['sifir', 'ikinci-el'],
          },
        },
      },
    },
    {
      slug: 'is',
      name: 'İş İlanları',
      nameEn: 'Jobs',
      attributeSchema: {
        fields: {
          jobType: { type: 'enum', label: 'İş tipi', required: true, options: ['tam-zamanli', 'yari-zamanli'] },
        },
      },
    },
    {
      slug: 'hizmet',
      name: 'Hizmetler',
      nameEn: 'Services',
      attributeSchema: {
        fields: {
          serviceArea: { type: 'string', label: 'Hizmet bölgesi', required: false },
        },
      },
    },
    {
      slug: 'mobilya',
      name: 'Mobilya & Ev',
      nameEn: 'Furniture & Home',
      attributeSchema: {
        fields: {
          condition: {
            type: 'enum',
            label: 'Durum',
            required: true,
            options: ['sifir', 'ikinci-el'],
          },
        },
      },
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  console.log('Seeded categories');

  const adminPasswordHash = await argon2.hash('AdminPass1', { type: argon2.argon2id });
  const admin = await prisma.user.upsert({
    where: { email: 'admin@turkiye-pazaryeri.local' },
    update: {},
    create: {
      email: 'admin@turkiye-pazaryeri.local',
      passwordHash: adminPasswordHash,
      phone: '+905551234567',
      phoneVerifiedAt: new Date(),
      roles: [Role.SUPER_ADMIN, Role.MODERATOR, Role.SUPPORT],
      totpSecret: DEV_ADMIN_TOTP_SECRET,
      totpEnabled: true,
    },
  });

  const supportPasswordHash = await argon2.hash('Support1Pass', { type: argon2.argon2id });
  await prisma.user.upsert({
    where: { email: 'support@turkiye-pazaryeri.local' },
    update: {},
    create: {
      email: 'support@turkiye-pazaryeri.local',
      passwordHash: supportPasswordHash,
      phone: '+905551234568',
      phoneVerifiedAt: new Date(),
      roles: [Role.SUPPORT],
      totpSecret: DEV_ADMIN_TOTP_SECRET,
      totpEnabled: true,
    },
  });

  await prisma.ticket.upsert({
    where: { id: 'seed-ticket-001' },
    update: {},
    create: {
      id: 'seed-ticket-001',
      type: 'SUPPORT_REQUEST',
      subject: 'Örnek destek talebi',
      body: 'Bu bir test destek talebidir.',
      creatorId: admin.id,
      status: 'OPEN',
      priority: 'MEDIUM',
    },
  });

  console.log('Seeded admin users');
  console.log('  admin@turkiye-pazaryeri.local / AdminPass1');
  console.log('  support@turkiye-pazaryeri.local / Support1Pass');
  console.log(`  Dev 2FA code (otplib): ${authenticator.generate(DEV_ADMIN_TOTP_SECRET)}`);

  const sellerPasswordHash = await argon2.hash('Seller1Pass', { type: argon2.argon2id });
  const seller = await prisma.user.upsert({
    where: { email: 'seller@turkiye-pazaryeri.local' },
    update: {},
    create: {
      email: 'seller@turkiye-pazaryeri.local',
      passwordHash: sellerPasswordHash,
      phone: '+905551234569',
      phoneVerifiedAt: new Date(),
      roles: [Role.USER],
    },
  });

  const categoryRows = await prisma.category.findMany({ select: { id: true, slug: true } });
  const categoryBySlug = Object.fromEntries(categoryRows.map((c) => [c.slug, c.id]));

  const seedListings: Array<{
    id: string;
    slug: string;
    title: string;
    description: string;
    categorySlug: string;
    price: number;
    city: string;
    district: string;
    pricingTier: PricingTier;
    attributes: Record<string, unknown>;
    publishedDaysAgo: number;
  }> = [
    {
      id: 'seed-listing-001',
      slug: 'seed-toyota-corolla-2020',
      title: 'Toyota Corolla 2020 — Düşük Kilometre',
      description: 'Bakımlı, tek elden Toyota Corolla. Tüm periyodik bakımları yapılmıştır.',
      categorySlug: 'vasita',
      price: 850_000,
      city: 'İstanbul',
      district: 'Kadıköy',
      pricingTier: PricingTier.PREMIUM,
      attributes: { year: 2020, brand: 'Toyota', mileage: 42000 },
      publishedDaysAgo: 1,
    },
    {
      id: 'seed-listing-002',
      slug: 'seed-kadikoy-daire-3-1',
      title: 'Kadıköy Moda 3+1 Satılık Daire',
      description: 'Deniz manzaralı, asansörlü binada ferah daire. Metro ve sahile yürüme mesafesinde.',
      categorySlug: 'emlak',
      price: 4_250_000,
      city: 'İstanbul',
      district: 'Kadıköy',
      pricingTier: PricingTier.STANDARD,
      attributes: { roomCount: '3+1', sqm: 120, listingType: 'satilik' },
      publishedDaysAgo: 2,
    },
    {
      id: 'seed-listing-003',
      slug: 'seed-iphone-15-pro',
      title: 'iPhone 15 Pro 256GB — Sıfır Ayarında',
      description: 'Kutusunda, garantili iPhone 15 Pro. Hiç kullanılmadı, fatura mevcut.',
      categorySlug: 'elektronik',
      price: 52_000,
      city: 'Ankara',
      district: 'Çankaya',
      pricingTier: PricingTier.PREMIUM,
      attributes: { brand: 'Apple', condition: 'sifir' },
      publishedDaysAgo: 0,
    },
    {
      id: 'seed-listing-004',
      slug: 'seed-magaza-satis-elemani',
      title: 'Mağaza Satış Elemanı — Tam Zamanlı',
      description: 'AVM içi mağazamız için deneyimli satış elemanı aranmaktadır.',
      categorySlug: 'is',
      price: 22_000,
      city: 'İzmir',
      district: 'Konak',
      pricingTier: PricingTier.FREE,
      attributes: { jobType: 'tam-zamanli' },
      publishedDaysAgo: 3,
    },
    {
      id: 'seed-listing-005',
      slug: 'seed-ev-temizligi-hizmeti',
      title: 'Profesyonel Ev Temizliği Hizmeti',
      description: 'Haftalık veya tek seferlik ev temizliği. Referanslı ekip, uygun fiyat.',
      categorySlug: 'hizmet',
      price: 1_200,
      city: 'Bursa',
      district: 'Nilüfer',
      pricingTier: PricingTier.FREE,
      attributes: { serviceArea: 'Bursa geneli' },
      publishedDaysAgo: 5,
    },
    {
      id: 'seed-listing-006',
      slug: 'seed-l-koltuk-takimi',
      title: 'Modern L Koltuk Takımı — İkinci El',
      description: 'Temiz, sigara içilmeyen evden L koltuk takımı. Nakliye alıcıya aittir.',
      categorySlug: 'mobilya',
      price: 18_500,
      city: 'Antalya',
      district: 'Muratpaşa',
      pricingTier: PricingTier.STANDARD,
      attributes: { condition: 'ikinci-el' },
      publishedDaysAgo: 4,
    },
    {
      id: 'seed-listing-007',
      slug: 'seed-honda-civic-2019',
      title: 'Honda Civic 2019 Otomatik',
      description: 'Hatasız boyasız Honda Civic. Tramer kaydı yok, takas düşünülür.',
      categorySlug: 'vasita',
      price: 920_000,
      city: 'İstanbul',
      district: 'Beşiktaş',
      pricingTier: PricingTier.FREE,
      attributes: { year: 2019, brand: 'Honda', mileage: 68000 },
      publishedDaysAgo: 6,
    },
    {
      id: 'seed-listing-009',
      slug: 'seed-vw-golf-2021',
      title: 'Volkswagen Golf 2021 1.5 TSI',
      description: 'Garantili, düşük kilometreli Golf. Full donanım, sunroof.',
      categorySlug: 'vasita',
      price: 1_050_000,
      city: 'Ankara',
      district: 'Çankaya',
      pricingTier: PricingTier.STANDARD,
      attributes: { year: 2021, brand: 'Volkswagen', mileage: 35000 },
      publishedDaysAgo: 2,
    },
    {
      id: 'seed-listing-010',
      slug: 'seed-renault-clio-2018',
      title: 'Renault Clio 2018 Benzinli',
      description: 'Ekonomik ve bakımlı Clio. Şehir içi kullanım için ideal.',
      categorySlug: 'vasita',
      price: 520_000,
      city: 'İzmir',
      district: 'Bornova',
      pricingTier: PricingTier.FREE,
      attributes: { year: 2018, brand: 'Renault', mileage: 95000 },
      publishedDaysAgo: 4,
    },
    {
      id: 'seed-listing-011',
      slug: 'seed-bmw-320i-2017',
      title: 'BMW 320i 2017 Sedan',
      description: 'Sport paket, deri döşeme, navigasyon. Yetkili servis bakımlı.',
      categorySlug: 'vasita',
      price: 1_380_000,
      city: 'İstanbul',
      district: 'Ataşehir',
      pricingTier: PricingTier.PREMIUM,
      attributes: { year: 2017, brand: 'BMW', mileage: 112000 },
      publishedDaysAgo: 3,
    },
    {
      id: 'seed-listing-012',
      slug: 'seed-ankara-daire-2-1',
      title: 'Ankara Çankaya 2+1 Kiralık Daire',
      description: 'Eşyalı, merkezi konumda ferah daire. Ulaşım imkanları mükemmel.',
      categorySlug: 'emlak',
      price: 22_000,
      city: 'Ankara',
      district: 'Çankaya',
      pricingTier: PricingTier.FREE,
      attributes: { roomCount: '2+1', sqm: 85, listingType: 'kiralik' },
      publishedDaysAgo: 1,
    },
    {
      id: 'seed-listing-013',
      slug: 'seed-izmir-villa-satilik',
      title: 'İzmir Urla Müstakil Villa',
      description: 'Deniz manzaralı, bahçeli müstakil villa. Havuz ve otopark mevcut.',
      categorySlug: 'emlak',
      price: 12_500_000,
      city: 'İzmir',
      district: 'Urla',
      pricingTier: PricingTier.PREMIUM,
      attributes: { roomCount: '4+2', sqm: 280, listingType: 'satilik' },
      publishedDaysAgo: 5,
    },
    {
      id: 'seed-listing-014',
      slug: 'seed-bursa-daire-1-1',
      title: 'Bursa Nilüfer 1+1 Satılık Daire',
      description: 'Yeni bina, asansörlü, otoparklı. Üniversiteye yakın.',
      categorySlug: 'emlak',
      price: 1_850_000,
      city: 'Bursa',
      district: 'Nilüfer',
      pricingTier: PricingTier.STANDARD,
      attributes: { roomCount: '1+1', sqm: 55, listingType: 'satilik' },
      publishedDaysAgo: 7,
    },
    {
      id: 'seed-listing-008',
      slug: 'seed-macbook-air-m2',
      title: 'MacBook Air M2 13" 512GB',
      description: 'Az kullanılmış MacBook Air M2. Apple Care+ aktif, orijinal şarj aleti dahil.',
      categorySlug: 'elektronik',
      price: 38_000,
      city: 'İstanbul',
      district: 'Şişli',
      pricingTier: PricingTier.PREMIUM,
      attributes: { brand: 'Apple', condition: 'ikinci-el' },
      publishedDaysAgo: 1,
    },
  ];

  for (const listing of seedListings) {
    const categoryId = categoryBySlug[listing.categorySlug];
    if (!categoryId) continue;

    const publishedAt = new Date(Date.now() - listing.publishedDaysAgo * 86_400_000);

    await prisma.listing.upsert({
      where: { slug: listing.slug },
      update: {
        status: ListingStatus.APPROVED,
        publishedAt,
        pricingTier: listing.pricingTier,
        price: listing.price,
        deletedAt: null,
      },
      create: {
        id: listing.id,
        userId: seller.id,
        categoryId,
        title: listing.title,
        description: listing.description,
        slug: listing.slug,
        attributes: listing.attributes as object,
        status: ListingStatus.APPROVED,
        pricingTier: listing.pricingTier,
        price: listing.price,
        city: listing.city,
        district: listing.district,
        publishedAt,
      },
    });
  }

  console.log(`Seeded ${seedListings.length} approved listings`);
  console.log('  seller@turkiye-pazaryeri.local / Seller1Pass');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
