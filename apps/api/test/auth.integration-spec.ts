import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { execSync } from 'child_process';
import cookieParser from 'cookie-parser';
import Redis from 'ioredis';
import request from 'supertest';
import { AppModule } from '../src/app.module';

const describeIfDb = process.env.SKIP_INTEGRATION ? describe.skip : describe;

describeIfDb('Auth (integration)', () => {
  let app: INestApplication;
  let redis: Redis;
  let dbAvailable = false;

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
  }, 60_000);

  afterAll(async () => {
    if (app) await app.close();
    if (redis) await redis.quit();
  });

  const testUser = {
    email: `seller-${Date.now()}@example.com`,
    password: 'SecurePass1',
    phone: '+905551234567',
  };

  it('registers, logs in, refreshes token, and logs out', async () => {
    if (!dbAvailable) return;

    const registerRes = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send(testUser)
      .expect(201);

    expect(registerRes.body.email).toBe(testUser.email);
    expect(registerRes.body.phoneVerified).toBe(false);

    const loginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    expect(loginRes.body.accessToken).toBeDefined();
    const cookies = loginRes.headers['set-cookie'] as unknown as string[];
    expect(cookies?.find((c) => c.startsWith('refresh_token='))).toBeDefined();

    const refreshRes = await request(app.getHttpServer())
      .post('/v1/auth/refresh')
      .set('Cookie', cookies)
      .expect(200);

    expect(refreshRes.body.accessToken).toBeDefined();

    await request(app.getHttpServer())
      .post('/v1/auth/logout')
      .set('Authorization', `Bearer ${refreshRes.body.accessToken}`)
      .set('Cookie', refreshRes.headers['set-cookie'] as unknown as string[])
      .expect(204);
  });

  it('rejects login with wrong password', async () => {
    if (!dbAvailable) return;

    await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: testUser.email, password: 'WrongPass1' })
      .expect(401);
  });

  it('returns current user from /me', async () => {
    if (!dbAvailable) return;

    const loginRes = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    const meRes = await request(app.getHttpServer())
      .get('/v1/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`)
      .expect(200);

    expect(meRes.body.email).toBe(testUser.email);
  });
});
