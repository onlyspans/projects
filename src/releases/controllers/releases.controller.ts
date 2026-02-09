import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ReleasesService } from '../services/releases.service';
import { CreateReleaseDto } from '../dto/create-release.dto';
import { UpdateReleaseDto } from '../dto/update-release.dto';
import { QueryReleasesDto } from '../dto/query-releases.dto';
import { Release } from '../entities/release.entity';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';

@ApiTags('releases')
@Controller('projects/:projectId/releases')
export class ReleasesController {
  constructor(private readonly releasesService: ReleasesService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of releases for a project' })
  @ApiParam({ name: 'projectId', description: 'Project ID (UUID)' })
  @ApiResponse({ status: 200, description: 'List of releases', type: Object })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findAll(
    @Param('projectId') projectId: string,
    @Query() query: QueryReleasesDto,
  ): Promise<PaginatedResponse<Release>> {
    return this.releasesService.findAll(projectId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get release by ID' })
  @ApiParam({ name: 'projectId', description: 'Project ID (UUID)' })
  @ApiParam({ name: 'id', description: 'Release ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Release found', type: Object })
  @ApiResponse({ status: 404, description: 'Release not found' })
  async findOne(@Param('id') id: string): Promise<Release> {
    return this.releasesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new release' })
  @ApiParam({ name: 'projectId', description: 'Project ID (UUID)' })
  @ApiResponse({ status: 201, description: 'Release created', type: Object })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 409, description: 'Release with this version already exists' })
  async create(@Param('projectId') projectId: string, @Body() createReleaseDto: CreateReleaseDto): Promise<Release> {
    return this.releasesService.create(projectId, createReleaseDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a release' })
  @ApiParam({ name: 'id', description: 'Release ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Release updated', type: Object })
  @ApiResponse({ status: 404, description: 'Release not found' })
  async update(@Param('id') id: string, @Body() updateReleaseDto: UpdateReleaseDto): Promise<Release> {
    return this.releasesService.update(id, updateReleaseDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a release (soft delete)' })
  @ApiParam({ name: 'id', description: 'Release ID (UUID)' })
  @ApiResponse({ status: 204, description: 'Release deleted' })
  @ApiResponse({ status: 404, description: 'Release not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.releasesService.remove(id);
  }
}
