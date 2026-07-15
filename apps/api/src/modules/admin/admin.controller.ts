import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  adminUsersQuerySchema,
  suspendUserSchema,
  updateFeatureFlagSchema,
  updateUserRolesSchema,
} from '@turkiye-pazaryeri/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, Roles } from '../../common/decorators/roles.decorator';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminAuditService } from './admin-audit.service';
import { AdminUsersService } from './admin-users.service';
import { FeatureFlagsService } from './feature-flags.service';

@ApiTags('admin')
@Controller('admin')
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly analytics: AdminAnalyticsService,
    private readonly users: AdminUsersService,
    private readonly flags: FeatureFlagsService,
    private readonly audit: AdminAuditService,
  ) {}

  @Get('analytics')
  @Roles(Role.MODERATOR, Role.SUPPORT, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Dashboard analytics overview' })
  getAnalytics() {
    return this.analytics.getOverview();
  }

  @Get('users')
  @Roles(Role.MODERATOR, Role.SUPPORT, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List users (admin)' })
  listUsers(@Query() query: Record<string, string>) {
    return this.users.list(adminUsersQuerySchema.parse(query));
  }

  @Get('users/:id')
  @Roles(Role.MODERATOR, Role.SUPPORT, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get user detail (admin)' })
  getUser(@Param('id') id: string) {
    return this.users.findById(id);
  }

  @Patch('users/:id/roles')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update user roles (super admin)' })
  updateRoles(
    @CurrentUser() admin: { id: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.users.updateRoles(admin.id, id, updateUserRolesSchema.parse(body));
  }

  @Post('users/:id/suspend')
  @Roles(Role.SUPER_ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Suspend user account' })
  suspend(
    @CurrentUser() admin: { id: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.users.suspend(admin.id, id, suspendUserSchema.parse(body));
  }

  @Get('feature-flags')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List feature flags' })
  listFlags() {
    return this.flags.findAll();
  }

  @Patch('feature-flags/:key')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Toggle feature flag' })
  updateFlag(
    @CurrentUser() admin: { id: string },
    @Param('key') key: string,
    @Body() body: unknown,
  ) {
    return this.flags.update(admin.id, key, updateFeatureFlagSchema.parse(body));
  }

  @Get('audit-log')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin audit log (append-only)' })
  auditLog(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.audit.list(
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }
}
