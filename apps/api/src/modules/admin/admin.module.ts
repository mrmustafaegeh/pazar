import { Module } from '@nestjs/common';
import { AdminAuditService } from './admin-audit.service';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminUsersService } from './admin-users.service';
import { FeatureFlagsService } from './feature-flags.service';
import { AdminController } from './admin.controller';

@Module({
  controllers: [AdminController],
  providers: [
    AdminAuditService,
    AdminAnalyticsService,
    AdminUsersService,
    FeatureFlagsService,
  ],
  exports: [AdminAuditService],
})
export class AdminModule {}
