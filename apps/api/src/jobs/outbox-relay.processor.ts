import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { OutboxService } from '../modules/outbox/outbox.service';
import { QueueService } from './queue.service';
import { QUEUE_NAMES } from './queues';

const EVENT_QUEUE_MAP: Record<string, string | string[]> = {
  'listing.submitted': QUEUE_NAMES.NOTIFICATION,
  'listing.approved': [QUEUE_NAMES.SEARCH_INDEX, QUEUE_NAMES.NOTIFICATION],
  'listing.rejected': QUEUE_NAMES.NOTIFICATION,
  'listing.image.queued': QUEUE_NAMES.IMAGE_PROCESSING,
  'ticket.created': QUEUE_NAMES.NOTIFICATION,
  'ticket.updated': QUEUE_NAMES.NOTIFICATION,
  'otp.send': QUEUE_NAMES.NOTIFICATION,
  'kvkk.export.requested': QUEUE_NAMES.KVKK,
  'kvkk.erasure.approved': QUEUE_NAMES.KVKK,
  'kvkk.export.ready': QUEUE_NAMES.NOTIFICATION,
  'kvkk.erasure.completed': QUEUE_NAMES.NOTIFICATION,
  'payment.completed': QUEUE_NAMES.NOTIFICATION,
};

@Injectable()
export class OutboxRelayProcessor implements OnModuleDestroy {
  private readonly logger = new Logger(OutboxRelayProcessor.name);
  private interval?: ReturnType<typeof setInterval>;
  private running = false;

  constructor(
    private readonly outbox: OutboxService,
    private readonly queue: QueueService,
  ) {}

  startPolling(intervalMs = 2000) {
    this.interval = setInterval(() => this.poll(), intervalMs);
    this.logger.log('Outbox relay polling started');
  }

  async poll(): Promise<void> {
    if (this.running) return;
    this.running = true;

    try {
      const events = await this.outbox.getUndispatched(50);

      for (const event of events) {
        const queueNames = EVENT_QUEUE_MAP[event.eventType] ?? QUEUE_NAMES.NOTIFICATION;
        const targets = Array.isArray(queueNames) ? queueNames : [queueNames];
        const payload = event.payload as Record<string, unknown>;

        for (const queueName of targets) {
          await this.queue.addJob(
            queueName,
            {
              ...payload,
              eventType: event.eventType,
              outboxId: event.id,
            },
            `${event.id}-${queueName}`,
          );
        }

        await this.outbox.markDispatched(event.id);
        this.logger.debug(`Dispatched ${event.eventType} → ${targets.join(', ')}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Outbox relay error: ${message}`, error instanceof Error ? error.stack : undefined);
    } finally {
      this.running = false;
    }
  }

  onModuleDestroy() {
    if (this.interval) clearInterval(this.interval);
  }
}
