import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Express } from 'express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { createListingSchema, searchListingsSchema, updateListingSchema } from '@turkiye-pazaryeri/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { PhoneVerifiedGuard } from '../../common/guards/phone-verified.guard';
import { ListingsService } from './listings.service';

@ApiTags('listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Browse approved listings' })
  browse(@Query() query: Record<string, string>) {
    return this.listings.browse(searchListingsSchema.parse(query));
  }

  @UseGuards(PhoneVerifiedGuard)
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create draft listing (phone verified required)' })
  create(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    return this.listings.create(user.id, createListingSchema.parse(body));
  }

  @UseGuards(PhoneVerifiedGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update draft listing' })
  update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.listings.update(user.id, id, updateListingSchema.parse(body));
  }

  @UseGuards(PhoneVerifiedGuard)
  @Post(':id/submit')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit listing for moderation' })
  submit(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.listings.submit(user.id, id);
  }

  @UseGuards(PhoneVerifiedGuard)
  @Post(':id/images')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload listing image to quarantine' })
  uploadImage(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.listings.uploadImage(user.id, id, file);
  }

  @Get('mine')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List current user listings' })
  findMine(@CurrentUser() user: { id: string }) {
    return this.listings.findMine(user.id);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get listing by SEO slug' })
  findBySlug(@Param('slug') slug: string, @CurrentUser() user?: { id: string }) {
    return this.listings.findBySlug(slug, user?.id);
  }

  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get listing by id (approved public, owner sees all)' })
  findOne(@Param('id') id: string, @CurrentUser() user?: { id: string }) {
    return this.listings.findById(id, user?.id);
  }
}
