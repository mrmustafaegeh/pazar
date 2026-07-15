import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { OutboxModule } from '../modules/outbox/outbox.module';
import { StorageModule } from '../storage/storage.module';
import { SearchModule } from '../modules/search/search.module';
import { JobsModule } from '../jobs/jobs.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';
import { KvkkModule } from '../modules/kvkk/kvkk.module';
import { ImageProcessingProcessor } from '../jobs/image-processing.processor';
import { SearchIndexProcessor } from '../jobs/search-index.processor';
import { NotificationProcessor } from '../jobs/notification.processor';
import { KvkkProcessor } from '../jobs/kvkk.processor';
import { OutboxRelayProcessor } from '../jobs/outbox-relay.processor';

@Module({
  imports: [
    DatabaseModule,
    OutboxModule,
    StorageModule,
    JobsModule,
    SearchModule,
    NotificationsModule,
    KvkkModule,
  ],
  providers: [
    ImageProcessingProcessor,
    SearchIndexProcessor,
    NotificationProcessor,
    KvkkProcessor,
    OutboxRelayProcessor,
  ],
  exports: [
    ImageProcessingProcessor,
    SearchIndexProcessor,
    NotificationProcessor,
    KvkkProcessor,
    OutboxRelayProcessor,
  ],
})
export class WorkerJobsModule {}
