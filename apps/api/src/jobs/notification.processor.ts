import { Injectable, Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { NotificationService } from '../modules/notifications/notification.service';
import { QUEUE_NAMES } from './queues';

interface NotificationJobData {
  eventType: string;
  payload?: Record<string, unknown>;
  [key: string]: unknown;
}

@Injectable()
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly notifications: NotificationService) {}

  createWorker(connection: { host: string; port: number; password?: string }): Worker {
    return new Worker<NotificationJobData>(
      QUEUE_NAMES.NOTIFICATION,
      async (job) => this.process(job),
      { connection, concurrency: 5 },
    );
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    const { eventType, ...rest } = job.data;
    this.logger.log(`Notification job: ${eventType}`);
    await this.notifications.handleEvent(eventType, rest as Record<string, unknown>);
  }
}
