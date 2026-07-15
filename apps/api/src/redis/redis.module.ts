import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import { RedisHealthIndicator } from './redis-health.indicator';
import { RedisThrottlerStorage } from './redis-throttler.storage';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return new Redis(config.getOrThrow<string>('REDIS_URL'));
      },
    },
    RedisHealthIndicator,
    RedisThrottlerStorage,
  ],
  exports: [REDIS_CLIENT, RedisHealthIndicator, RedisThrottlerStorage],
})
export class RedisModule {}
