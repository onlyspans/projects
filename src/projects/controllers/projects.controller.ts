import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiConsumes } from '@nestjs/swagger';
import type { FileValidator } from '@nestjs/common/pipes/file/file-validator.interface';
import { ProjectsService } from '../services/projects.service';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { QueryProjectsDto } from '../dto/query-projects.dto';
import { Project } from '../entities/project.entity';
import { PaginatedResponse } from '@common/interfaces/paginated-response.interface';
import { PROJECT_ICON_MAX_SIZE_BYTES } from '@storage/storage.constants';
import type { ProjectIconUpload } from '@storage/storage.constants';

const iconUploadValidators: FileValidator[] = [
  new MaxFileSizeValidator({ maxSize: PROJECT_ICON_MAX_SIZE_BYTES }),
  new FileTypeValidator({ fileType: /^image\/(png|jpeg|jpg|gif|webp)$/ }),
];

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of projects with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'List of projects', type: Object })
  async findAll(@Query() query: QueryProjectsDto): Promise<PaginatedResponse<Project>> {
    return this.projectsService.findAll(query);
  }

  @Post(':id/icon')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload project icon' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary', description: 'Image (PNG, JPEG, GIF, WebP, max 2MB)' } },
    },
  })
  @ApiParam({ name: 'id', description: 'Project ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Project with updated imageUrl', type: Object })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async uploadIcon(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: iconUploadValidators,
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ): Promise<Project> {
    const upload: ProjectIconUpload = {
      buffer: file.buffer,
      mimetype: file.mimetype,
      originalname: file.originalname,
      size: file.size,
    };
    return this.projectsService.uploadProjectIcon(id, upload);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiParam({ name: 'id', description: 'Project ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Project found', type: Object })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async findOne(@Param('id') id: string): Promise<Project> {
    return this.projectsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created', type: Object })
  @ApiResponse({ status: 409, description: 'Project with this slug already exists' })
  async create(@Body() createProjectDto: CreateProjectDto): Promise<Project> {
    return this.projectsService.create(createProjectDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a project' })
  @ApiParam({ name: 'id', description: 'Project ID (UUID)' })
  @ApiResponse({ status: 200, description: 'Project updated', type: Object })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @ApiResponse({ status: 409, description: 'Project with this slug already exists' })
  async update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto): Promise<Project> {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a project (soft delete)' })
  @ApiParam({ name: 'id', description: 'Project ID (UUID)' })
  @ApiResponse({ status: 204, description: 'Project deleted' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.projectsService.remove(id);
  }
}
