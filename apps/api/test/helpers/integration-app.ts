import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { execSync } from 'child_process';
import cookieParser from 'cookie-parser';
import Redis from 'ioredis';
import { AppModule } from '../../src/app.module';

export interface IntegrationContext {
  app: INestApplication;
  redis: Redis;
  dbAvailable: boolean;
}

export async function setupIntegrationApp(): Promise<IntegrationContext> {
  let redis: Redis;
  let dbAvailable = false;

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
    return { app: null as never, redis: null as never, dbAvailable: false };
  }

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.use(cookieParser());
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  await app.init();

  return { app, redis, dbAvailable };
}

export async function teardownIntegrationApp(ctx: IntegrationContext) {
  if (ctx.app) await ctx.app.close();
  if (ctx.redis) await ctx.redis.quit();
}
