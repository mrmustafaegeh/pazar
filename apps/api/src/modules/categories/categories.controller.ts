import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createCategorySchema, updateCategorySchema } from '@turkiye-pazaryeri/types';
import { Public } from '../../common/decorators/public.decorator';
import { Role, Roles } from '../../common/decorators/roles.decorator';
import { CategoriesService } from './categories.service';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List all categories' })
  findAll() {
    return this.categories.findAll();
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get category by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.categories.findBySlug(slug);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create category (admin)' })
  create(@Body() body: unknown) {
    return this.categories.create(createCategorySchema.parse(body));
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.MODERATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update category (admin)' })
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.categories.update(id, updateCategorySchema.parse(body));
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete category (super admin)' })
  remove(@Param('id') id: string) {
    return this.categories.softDelete(id);
  }
}
