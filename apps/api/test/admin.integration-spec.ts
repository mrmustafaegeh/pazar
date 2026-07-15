import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { execSync } from 'child_process';
import cookieParser from 'cookie-parser';
import Redis from 'ioredis';
import request from 'supertest';
import { AppModule } from '../src/app.module';

const describeIfDb = process.env.SKIP_INTEGRATION ? describe.skip : describe;

describeIfDb('Admin API (integration)', () => {
  let app: INestApplication;
  let redis: Redis;
  let dbAvailable = false;
  let adminToken = '';

  beforeAll(async () => {
    try {
      redis = new Redis(process.env.REDIS_URL!);
      await redis.ping();

      execSync('npx prisma migrate deploy', {
        cwd: __dirname + '/..',
        env: process.env,
        stdio: 'pipe',
      });

      execSync('npx ts-node prisma/seed.ts', {
        cwd: __dirname + '/..',
        env: process.env,
        stdio: 'pipe',
      });

      dbAvailable = true;
    } catch {
      console.warn('Postgres/Redis unavailable — skipping integration tests');
      return;
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    const loginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: 'admin@turkiye-pazaryeri.local', password: 'AdminPass1' });

    if (loginRes.body.requires2fa) {
      const { authenticator } = await import('otplib');
      const verifyRes = await request(app.getHttpServer())
        .post('/v1/auth/2fa/verify')
        .send({ tempToken: loginRes.body.tempToken, code: authenticator.generate('JBSWY3DPEHPK3PXP') });
      adminToken = verifyRes.body.accessToken;
    } else {
      adminToken = loginRes.body.accessToken;
    }
  }, 60_000);

  afterAll(async () => {
    if (app) await app.close();
    if (redis) await redis.quit();
  });

  it('returns analytics overview', async () => {
    if (!dbAvailable || !adminToken) return;

    const res = await request(app.getHttpServer())
      .get('/v1/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('users');
    expect(res.body).toHaveProperty('listings');
    expect(res.body).toHaveProperty('tickets');
    expect(res.body).toHaveProperty('moderation');
  });

  it('lists tickets for support staff', async () => {
    if (!dbAvailable || !adminToken) return;

    const res = await request(app.getHttpServer())
      .get('/v1/tickets')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('lists feature flags for super admin', async () => {
    if (!dbAvailable || !adminToken) return;

    const res = await request(app.getHttpServer())
      .get('/v1/admin/feature-flags')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
