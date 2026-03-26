import { Controller, Get, Post, Put, Patch, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { EnvironmentsService } from '../services/environments.service';
import { CreateEnvironmentDto } from '../dto/create-environment.dto';
import { UpdateEnvironmentDto } from '../dto/update-environment.dto';
import { ReorderEnvironmentsDto } from '../dto/reorder-environments.dto';
import type { Environment } from '@database/generated/client';

@ApiTags('environments')
@Controller('environments')
export class EnvironmentsController {
  constructor(private readonly environmentsService: EnvironmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List active environments (catalog), ordered by position' })
  @ApiResponse({ status: 200, description: 'Ordered list', type: Object })
  async findAll(): Promise<Environment[]> {
    return this.environmentsService.findAll();
  }

  @Put('reorder')
  @ApiOperation({
    summary: 'Reorder all active environments',
    description:
      'Send every active environment UUID once, in pipeline order. Positions are reassigned 1..n atomically (drag-and-drop friendly).',
  })
  @ApiResponse({ status: 200, description: 'Catalog after reorder', type: Object })
  @ApiResponse({ status: 400, description: 'Wrong or incomplete ID list' })
  async reorder(@Body() dto: ReorderEnvironmentsDto): Promise<Environment[]> {
    return this.environmentsService.reorder(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get environment by ID' })
  @ApiParam({ name: 'id', description: 'Environment ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Found', type: Object })
  @ApiResponse({ status: 404, description: 'Not found or soft-deleted' })
  async findOne(@Param('id') id: string): Promise<Environment> {
    return this.environmentsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create environment' })
  @ApiResponse({ status: 201, description: 'Created', type: Object })
  @ApiResponse({ status: 409, description: 'Position already in use' })
  async create(@Body() dto: CreateEnvironmentDto): Promise<Environment> {
    return this.environmentsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partially update environment' })
  @ApiParam({ name: 'id', description: 'Environment ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Updated', type: Object })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Position already in use' })
  async update(@Param('id') id: string, @Body() dto: UpdateEnvironmentDto): Promise<Environment> {
    return this.environmentsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete environment and remove its id from all projects' })
  @ApiParam({ name: 'id', description: 'Environment ID (UUID)' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.environmentsService.remove(id);
  }
}
