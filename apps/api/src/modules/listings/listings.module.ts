import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { OutboxModule } from '../outbox/outbox.module';
import { PaymentsModule } from '../payments/payments.module';
import { StorageModule } from '../../storage/storage.module';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';

@Module({
  imports: [CategoriesModule, OutboxModule, StorageModule, PaymentsModule],
  controllers: [ListingsController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
