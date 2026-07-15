import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { searchListingsSchema } from '@turkiye-pazaryeri/types';
import { Public } from '../../common/decorators/public.decorator';
import { SearchService } from './search.service';
import { ListingsService } from '../listings/listings.service';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly listings: ListingsService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Search approved listings via OpenSearch' })
  async searchListings(@Query() query: Record<string, string>) {
    const params = searchListingsSchema.parse(query);
    try {
      return await this.searchService.search(params);
    } catch {
      return this.listings.browse(params);
    }
  }
}

