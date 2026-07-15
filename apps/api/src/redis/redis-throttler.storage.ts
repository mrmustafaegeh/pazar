import { Injectable } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { Inject } from '@nestjs/common';

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async increment(
    key: string,
    ttl: number,
  ): Promise<{ totalHits: number; timeToExpire: number; isBlocked: boolean; timeToBlockExpire: number }> {
    const totalHits = await this.redis.incr(key);
    if (totalHits === 1) {
      await this.redis.pexpire(key, ttl);
    }
    const timeToExpire = await this.redis.pttl(key);
    return { totalHits, timeToExpire, isBlocked: false, timeToBlockExpire: 0 };
  }
}
