import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  createTicketSchema,
  reportListingSchema,
  reportUserSchema,
  ticketsQuerySchema,
  updateTicketSchema,
} from '@turkiye-pazaryeri/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, Roles } from '../../common/decorators/roles.decorator';
import { TicketsService } from './tickets.service';

@ApiTags('tickets')
@Controller('tickets')
@ApiBearerAuth()
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}

  @Post()
  @ApiOperation({ summary: 'Create support ticket' })
  create(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    return this.tickets.create(user.id, createTicketSchema.parse(body));
  }

  @Post('report-listing')
  @ApiOperation({ summary: 'Report a listing' })
  reportListing(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    return this.tickets.reportListing(user.id, reportListingSchema.parse(body));
  }

  @Post('report-user')
  @ApiOperation({ summary: 'Report a user' })
  reportUser(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    return this.tickets.reportUser(user.id, reportUserSchema.parse(body));
  }

  @Get('mine')
  @ApiOperation({ summary: 'List current user tickets' })
  listMine(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.tickets.listMine(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get()
  @Roles(Role.SUPPORT, Role.MODERATOR, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List tickets (admin)' })
  list(@Query() query: Record<string, string>) {
    return this.tickets.list(ticketsQuerySchema.parse(query));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket detail' })
  async get(@CurrentUser() user: { id: string; roles?: string[] }, @Param('id') id: string) {
    const adminRoles = ['SUPPORT', 'MODERATOR', 'SUPER_ADMIN'];
    if (user.roles?.some((r) => adminRoles.includes(r))) {
      return this.tickets.findById(id);
    }
    return this.tickets.assertSupportAccess(user.id, id);
  }

  @Patch(':id')
  @Roles(Role.SUPPORT, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update ticket status/assignment' })
  update(
    @CurrentUser() admin: { id: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.tickets.update(admin.id, id, updateTicketSchema.parse(body));
  }
}
