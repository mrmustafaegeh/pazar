import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { JobsModule } from './jobs/jobs.module';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TerminusModule } from '@nestjs/terminus';
import { LoggerModule } from 'nestjs-pino';
import { validateEnv } from './config/env.schema';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { DatabaseModule } from './database/database.module';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ListingsModule } from './modules/listings/listings.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { ComplaintsModule } from './modules/complaints/complaints.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { SearchModule } from './modules/search/search.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { OutboxModule } from './modules/outbox/outbox.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { KvkkModule } from './modules/kvkk/kvkk.module';
import { RedisModule } from './redis/redis.module';
import { RedisThrottlerStorage } from './redis/redis-throttler.storage';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        autoLogging: true,
        customProps: (req) => ({
          requestId: (req as { id?: string }).id,
        }),
      },
    }),
    RedisModule,
    JobsModule,
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [RedisThrottlerStorage],
      useFactory: (storage: RedisThrottlerStorage) => ({
        throttlers: [
          { name: 'default', ttl: 60000, limit: 100 },
          { name: 'auth', ttl: 60000, limit: 10 },
        ],
        storage,
      }),
    }),
    TerminusModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    ListingsModule,
    CategoriesModule,
    ModerationModule,
    ComplaintsModule,
    MessagingModule,
    SearchModule,
    PaymentsModule,
    OutboxModule,
    AdminModule,
    NotificationsModule,
    KvkkModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CsrfMiddleware).forRoutes('*');
  }
}
