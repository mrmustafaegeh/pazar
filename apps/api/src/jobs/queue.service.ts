import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.constants';

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly queues = new Map<string, Queue>();
  private readonly connection: { host: string; port: number; password?: string };

  constructor(
    @Inject(REDIS_CLIENT) redis: Redis,
    private readonly config: ConfigService,
  ) {
    const url = new URL(config.getOrThrow<string>('REDIS_URL'));
    this.connection = {
      host: url.hostname,
      port: parseInt(url.port || '6379', 10),
      password: url.password || undefined,
    };
  }

  getQueue(name: string): Queue {
    if (!this.queues.has(name)) {
      this.queues.set(
        name,
        new Queue(name, { connection: this.connection }),
      );
    }
    return this.queues.get(name)!;
  }

  async addJob(queueName: string, data: Record<string, unknown>, jobId?: string) {
    const queue = this.getQueue(queueName);
    return queue.add(queueName, data, {
      jobId,
      removeOnComplete: 1000,
      removeOnFail: 5000,
    });
  }

  async onModuleDestroy() {
    for (const queue of this.queues.values()) {
      await queue.close();
    }
  }
}
