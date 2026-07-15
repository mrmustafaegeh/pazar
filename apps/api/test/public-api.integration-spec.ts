import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { execSync } from 'child_process';
import cookieParser from 'cookie-parser';
import Redis from 'ioredis';
import request from 'supertest';
import { AppModule } from '../src/app.module';

const describeIfDb = process.env.SKIP_INTEGRATION ? describe.skip : describe;

describeIfDb('Public API (integration)', () => {
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

  it('lists categories', async () => {
    if (!dbAvailable) return;

    const res = await request(app.getHttpServer()).get('/v1/categories').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('slug');
  });

  it('browses listings with pagination', async () => {
    if (!dbAvailable) return;

    const res = await request(app.getHttpServer())
      .get('/v1/listings?page=1&limit=10')
      .expect(200);

    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page', 1);
  });

  it('searches listings (falls back to Prisma when OpenSearch unavailable)', async () => {
    if (!dbAvailable) return;

    const res = await request(app.getHttpServer())
      .get('/v1/search?q=test&page=1&limit=10')
      .expect(200);

    expect(res.body).toHaveProperty('items');
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('returns category by slug', async () => {
    if (!dbAvailable) return;

    const res = await request(app.getHttpServer()).get('/v1/categories/vasita').expect(200);
    expect(res.body.slug).toBe('vasita');
    expect(res.body).toHaveProperty('attributeSchema');
  });
});
