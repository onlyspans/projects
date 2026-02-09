import { Controller, Get, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ReleasesService } from '../services/releases.service';
import { UpdateReleaseDto } from '../dto/update-release.dto';
import { Release } from '../entities/release.entity';

@ApiTags('releases')
@Controller('releases')
export class ReleasesByIdController {
  constructor(private readonly releasesService: ReleasesService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get release by ID' })
  @ApiParam({ name: 'id', description: 'Release ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Release found', type: Object })
  @ApiResponse({ status: 404, description: 'Release not found' })
  async findOne(@Param('id') id: string): Promise<Release> {
    return this.releasesService.findOne(id);
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
