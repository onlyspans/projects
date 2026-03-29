import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReleasesService } from '../services/releases.service';
import { QueryRecentReleasesDto } from '../dto/query-releases.dto';
import type { ReleaseWithProjectEnvironments } from '../types/release.types';
import { PaginatedResponse } from '@common/interfaces/paginated-response.interface';

@ApiTags('releases')
@Controller('releases')
export class RecentReleasesController {
  constructor(private readonly releasesService: ReleasesService) {}

  @Get('recent')
  @ApiOperation({
    summary: 'Recent releases (one latest release per project)',
    description:
      'Newest non-deleted release per non-deleted project, ordered by release date. Filters: tagIds (OR), search (project name). Each item includes project with environments.',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of releases', type: Object })
  async findRecent(@Query() query: QueryRecentReleasesDto): Promise<PaginatedResponse<ReleaseWithProjectEnvironments>> {
    return this.releasesService.findRecentPerProject(query);
  }
}
