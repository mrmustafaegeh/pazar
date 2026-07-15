import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { OutboxModule } from '../outbox/outbox.module';
import { KvkkController } from './kvkk.controller';
import { KvkkService } from './kvkk.service';

@Module({
  imports: [OutboxModule, AdminModule],
  controllers: [KvkkController],
  providers: [KvkkService],
  exports: [KvkkService],
})
export class KvkkModule {}
