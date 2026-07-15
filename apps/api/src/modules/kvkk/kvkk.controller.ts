import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { kvkkDataExportSchema, kvkkDeletionSchema } from '@turkiye-pazaryeri/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { KvkkService } from './kvkk.service';

@ApiTags('kvkk')
@Controller('kvkk')
@ApiBearerAuth()
export class KvkkController {
  constructor(private readonly kvkk: KvkkService) {}

  @Post('data-export')
  @ApiOperation({ summary: 'Request KVKK personal data export' })
  requestExport(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    kvkkDataExportSchema.parse(body);
    return this.kvkk.requestDataExport(user.id);
  }

  @Get('preview')
  @ApiOperation({ summary: 'Preview exportable data categories (metadata only)' })
  preview(@CurrentUser() user: { id: string }) {
    return this.kvkk.buildExportBundle(user.id).then((bundle) => ({
      exportedAt: bundle.exportedAt,
      categories: {
        profile: true,
        listings: bundle.user.listings.length,
        tickets: bundle.user.ticketsCreated.length,
        messages: bundle.user.messagesSent.length,
      },
    }));
  }

  @Post('deletion-request')
  @ApiOperation({ summary: 'Request account deletion under KVKK' })
  requestDeletion(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    return this.kvkk.requestDeletion(user.id, kvkkDeletionSchema.parse(body));
  }
}
