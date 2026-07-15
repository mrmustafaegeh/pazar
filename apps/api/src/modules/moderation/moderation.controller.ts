import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { rejectListingSchema } from '@turkiye-pazaryeri/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, Roles } from '../../common/decorators/roles.decorator';
import { ModerationService } from './moderation.service';

@ApiTags('moderation')
@Controller('moderation')
@Roles(Role.MODERATOR, Role.SUPER_ADMIN)
@ApiBearerAuth()
export class ModerationController {
  constructor(private readonly moderation: ModerationService) {}

  @Get('queue')
  @ApiOperation({ summary: 'Get moderation queue (pending listings)' })
  getQueue(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.moderation.getQueue(
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve listing' })
  approve(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.moderation.approve(user.id, id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject listing with reason' })
  reject(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.moderation.reject(user.id, id, rejectListingSchema.parse(body));
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get moderation history for listing' })
  history(@Param('id') id: string) {
    return this.moderation.getHistory(id);
  }
}
