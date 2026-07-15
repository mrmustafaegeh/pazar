import request from 'supertest';
import { setupIntegrationApp, teardownIntegrationApp } from './helpers/integration-app';

const describeIfDb = process.env.SKIP_INTEGRATION ? describe.skip : describe;

describeIfDb('Tickets & KVKK (integration)', () => {
  let ctx: Awaited<ReturnType<typeof setupIntegrationApp>>;
  let accessToken = '';

  const user = {
    email: `ticket-user-${Date.now()}@example.com`,
    password: 'SecurePass1',
    phone: '+905554443322',
  };

  beforeAll(async () => {
    ctx = await setupIntegrationApp();
    if (!ctx.dbAvailable) return;

    await request(ctx.app.getHttpServer()).post('/v1/auth/register').send(user).expect(201);

    const loginRes = await request(ctx.app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: user.email, password: user.password })
      .expect(200);

    accessToken = loginRes.body.accessToken;
  }, 60_000);

  afterAll(async () => {
    await teardownIntegrationApp(ctx);
  });

  it('creates support ticket and lists mine', async () => {
    if (!ctx.dbAvailable) return;

    const createRes = await request(ctx.app.getHttpServer())
      .post('/v1/tickets')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'SUPPORT_REQUEST',
        subject: 'Test destek',
        body: 'Entegrasyon testi destek talebi metni.',
      })
      .expect(201);

    expect(createRes.body.id).toBeDefined();

    const mineRes = await request(ctx.app.getHttpServer())
      .get('/v1/tickets/mine')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(mineRes.body.items.length).toBeGreaterThan(0);
  });

  it('requests KVKK data export', async () => {
    if (!ctx.dbAvailable) return;

    const res = await request(ctx.app.getHttpServer())
      .post('/v1/kvkk/data-export')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ confirmation: true })
      .expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

    expect(res.body.ticketId).toBeDefined();
  });

  it('previews KVKK exportable categories', async () => {
    if (!ctx.dbAvailable) return;

    const res = await request(ctx.app.getHttpServer())
      .get('/v1/kvkk/preview')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.categories).toHaveProperty('profile', true);
  });
});
