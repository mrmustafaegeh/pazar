import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { setupIntegrationApp, teardownIntegrationApp } from './helpers/integration-app';

const describeIfDb = process.env.SKIP_INTEGRATION ? describe.skip : describe;

describeIfDb('Listings lifecycle (integration)', () => {
  const prisma = new PrismaClient();
  let ctx: Awaited<ReturnType<typeof setupIntegrationApp>>;

  const seller = {
    email: `listing-seller-${Date.now()}@example.com`,
    password: 'SecurePass1',
    phone: '+905559876543',
  };

  let accessToken = '';
  let categoryId = '';

  beforeAll(async () => {
    ctx = await setupIntegrationApp();
    if (!ctx.dbAvailable) return;

    const cat = await prisma.category.findFirst({ where: { slug: 'elektronik' } });
    categoryId = cat!.id;
  }, 60_000);

  afterAll(async () => {
    await prisma.$disconnect();
    await teardownIntegrationApp(ctx);
  });

  it('registers seller, verifies phone, creates and submits listing', async () => {
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
        title: 'Test Elektronik İlan',
        description: 'Bu bir entegrasyon testi ilanıdır, yeterince uzun açıklama.',
        price: 1500,
        attributes: { brand: 'Apple', condition: 'ikinci-el' },
      })
      .expect(201);

    expect(createRes.body.status).toBe('DRAFT');

    const submitRes = await request(ctx.app.getHttpServer())
      .post(`/v1/listings/${createRes.body.id}/submit`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    expect(submitRes.body.status).toBe('PENDING');
  });

  it('rejects listing create without phone verification', async () => {
    if (!ctx.dbAvailable) return;

    const unverified = {
      email: `unverified-${Date.now()}@example.com`,
      password: 'SecurePass1',
      phone: '+905551112233',
    };

    await request(ctx.app.getHttpServer()).post('/v1/auth/register').send(unverified).expect(201);

    const loginRes = await request(ctx.app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: unverified.email, password: unverified.password })
      .expect(200);

    await request(ctx.app.getHttpServer())
      .post('/v1/listings')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
      .send({
        categoryId,
        title: 'Telefonsuz ilan',
        description: 'Bu ilan telefon doğrulaması olmadan oluşturulamaz.',
        attributes: { brand: 'X', condition: 'sifir' },
      })
      .expect(403);
  });
});
