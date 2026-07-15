import { Module } from '@nestjs/common';
import { OutboxModule } from '../outbox/outbox.module';
import { PaymentProviderService } from './payment-provider.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [OutboxModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentProviderService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
