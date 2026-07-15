import { Module } from '@nestjs/common';
import { AttributeValidatorService } from './attribute-validator.service';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService, AttributeValidatorService],
  exports: [CategoriesService, AttributeValidatorService],
})
export class CategoriesModule {}
