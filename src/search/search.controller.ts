import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Search businesses and services' })
  async search(
    @Query('q') query?: string,
    @Query('category') categorySlug?: string,
    @Query('lat') lat?: number,
    @Query('lng') lng?: number,
    @Query('radius') radiusKm?: number,
    @Query('city') city?: string,
    @Query('page') page?: number,
    @Query('per_page') perPage?: number,
    @Query('sort') sortBy?: string,
  ) {
    return this.searchService.search({
      query,
      categorySlug,
      lat,
      lng,
      radiusKm,
      city,
      page: page || 1,
      perPage: perPage || 20,
      sortBy,
    });
  }

  @Public()
  @Get('categories')
  @ApiOperation({ summary: 'Get all service categories' })
  async getCategories() {
    return this.searchService.getCategories();
  }
}
