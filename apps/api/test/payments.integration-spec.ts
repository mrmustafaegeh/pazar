import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { setupIntegrationApp, teardownIntegrationApp } from './helpers/integration-app';

const describeIfDb = process.env.SKIP_INTEGRATION ? describe.skip : describe;

describeIfDb('Payments checkout (integration)', () => {
  const prisma = new PrismaClient();
  let ctx: Awaited<ReturnType<typeof setupIntegrationApp>>;

  const seller = {
    email: `pay-seller-${Date.now()}@example.com`,
    password: 'SecurePass1',
    phone: '+905551112233',
  };

  let accessToken = '';
  let categoryId = '';
  let listingId = '';

  beforeAll(async () => {
    ctx = await setupIntegrationApp();
    if (!ctx.dbAvailable) return;

    await prisma.featureFlag.upsert({
      where: { key: 'payments_enabled' },
      create: { key: 'payments_enabled', enabled: true, description: 'test' },
      update: { enabled: true },
    });

    const cat = await prisma.category.findFirst({ where: { slug: 'elektronik' } });
    categoryId = cat!.id;
  }, 60_000);

  afterAll(async () => {
    if (ctx?.dbAvailable) {
      await prisma.featureFlag.update({
        where: { key: 'payments_enabled' },
        data: { enabled: false },
      });
    }
    await prisma.$disconnect();
    if (ctx) await teardownIntegrationApp(ctx);
  });

  it('checkout → confirm → submit with paid tier', async () => {
    if (!ctx.dbAvailable) return;

    const registerRes = await request(ctx.app.getHttpServer())
      .post('/v1/auth/register')
      .send(seller)
      .expect(201);

    await prisma.user.update({
      where: { id: registerRes.body.id },
      data: { phoneVerifiedAt: new Date() },
    });

    const loginRes = await request(ctx.app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: seller.email, password: seller.password })
      .expect(200);

    accessToken = loginRes.body.accessToken;

    const createRes = await request(ctx.app.getHttpServer())
      .post('/v1/listings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        categoryId,
        title: 'Öne Çıkan Test İlan',
        description: 'Ödeme entegrasyon testi için yeterince uzun açıklama metni.',
        price: 2500,
        attributes: { brand: 'Samsung', condition: 'sıfır' },
      })
      .expect(201);

    listingId = createRes.body.id;

    const idempotencyKey = `test-${listingId}-standard`;

    const checkoutRes = await request(ctx.app.getHttpServer())
      .post('/v1/payments/checkout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        listingId,
        pricingTier: 'STANDARD',
        idempotencyKey,
      })
      .expect(201);

    expect(checkoutRes.body.status).toBe('PENDING');
    const paymentId = checkoutRes.body.id;

    const duplicateRes = await request(ctx.app.getHttpServer())
      .post('/v1/payments/checkout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        listingId,
        pricingTier: 'STANDARD',
        idempotencyKey,
      })
      .expect(201);

    expect(duplicateRes.body.id).toBe(paymentId);

    await request(ctx.app.getHttpServer())
      .post(`/v1/payments/${paymentId}/confirm`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    const submitRes = await request(ctx.app.getHttpServer())
      .post(`/v1/listings/${listingId}/submit`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    expect(submitRes.body.status).toBe('PENDING');

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    expect(listing?.pricingTier).toBe('STANDARD');
    expect(listing?.paymentStatus).toBe('PAID');
  });

  it('rejects submit without payment when tier is paid', async () => {
    if (!ctx.dbAvailable) return;

    const createRes = await request(ctx.app.getHttpServer())
      .post('/v1/listings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        categoryId,
        title: 'Ödenmemiş Premium İlan',
        description: 'Ödeme olmadan gönderim testi için yeterince uzun açıklama.',
        price: 5000,
        attributes: { brand: 'Apple', condition: 'sıfır' },
      })
      .expect(201);

    await prisma.listing.update({
      where: { id: createRes.body.id },
      data: { pricingTier: 'PREMIUM', paymentStatus: 'PENDING' },
    });

    await request(ctx.app.getHttpServer())
      .post(`/v1/listings/${createRes.body.id}/submit`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(400);
  });
});
