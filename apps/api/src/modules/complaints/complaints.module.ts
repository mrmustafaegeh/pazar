import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { OutboxModule } from '../outbox/outbox.module';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  imports: [AdminModule, OutboxModule],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class ComplaintsModule {}
