import { Injectable, Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import { KvkkService } from '../modules/kvkk/kvkk.service';
import { QUEUE_NAMES } from './queues';

@Injectable()
export class KvkkProcessor {
  private readonly logger = new Logger(KvkkProcessor.name);

  constructor(private readonly kvkk: KvkkService) {}

  createWorker(connection: { host: string; port: number; password?: string }): Worker {
    return new Worker<Record<string, unknown>>(
      QUEUE_NAMES.KVKK,
      async (job) => this.process(job),
      { connection, concurrency: 2 },
    );
  }

  async process(job: Job<Record<string, unknown>>): Promise<void> {
    const eventType = String(job.data.eventType ?? '');
    const userId = String(job.data.userId ?? '');
    const ticketId = job.data.ticketId ? String(job.data.ticketId) : undefined;
    const adminId = job.data.adminId ? String(job.data.adminId) : undefined;

    this.logger.log(`KVKK job: ${eventType} for ${userId}`);

    if (eventType === 'kvkk.export.requested') {
      await this.kvkk.processExport(userId, ticketId);
      return;
    }

    if (eventType === 'kvkk.erasure.approved' && adminId) {
      await this.kvkk.processErasure(userId, adminId, ticketId);
    }
  }
}
