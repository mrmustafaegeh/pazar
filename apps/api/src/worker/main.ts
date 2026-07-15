import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { Worker } from 'bullmq';
import { validateEnv } from '../config/env.schema';
import { WorkerJobsModule } from './worker-jobs.module';
import { ImageProcessingProcessor } from '../jobs/image-processing.processor';
import { SearchIndexProcessor } from '../jobs/search-index.processor';
import { NotificationProcessor } from '../jobs/notification.processor';
import { KvkkProcessor } from '../jobs/kvkk.processor';
import { OutboxRelayProcessor } from '../jobs/outbox-relay.processor';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
      },
    }),
    RedisModule,
    WorkerJobsModule,
  ],
})
class WorkerModule {}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService);
  const logger = app.get(Logger);

  const url = new URL(config.getOrThrow<string>('REDIS_URL'));
  const connection = {
    host: url.hostname,
    port: parseInt(url.port || '6379', 10),
    password: url.password || undefined,
  };

  const workers: Worker[] = [
    app.get(ImageProcessingProcessor).createWorker(connection),
    app.get(SearchIndexProcessor).createWorker(connection),
    app.get(NotificationProcessor).createWorker(connection),
    app.get(KvkkProcessor).createWorker(connection),
  ];

  app.get(OutboxRelayProcessor).startPolling(2000);

  logger.log(`Worker started with ${workers.length} BullMQ consumers + outbox relay`);

  const shutdown = async () => {
    logger.log('Shutting down worker...');
    await Promise.all(workers.map((w) => w.close()));
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap();
