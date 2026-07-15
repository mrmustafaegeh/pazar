import { Module } from '@nestjs/common';
import { ListingsModule } from '../listings/listings.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [ListingsModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
