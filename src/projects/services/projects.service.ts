import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { ProjectsRepository } from '../repositories/projects.repository';
import { Project, ProjectStatus } from '../entities/project.entity';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { QueryProjectsDto } from '../dto/query-projects.dto';
import { PaginatedResponse } from '@common/interfaces/paginated-response.interface';
import { StorageService } from '@storage/storage.service';
import {
  PROJECT_ICON_MIME_TYPES,
  PROJECT_ICON_MAX_SIZE_BYTES,
  type ProjectIconUpload,
} from '@storage/storage.constants';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly projectsRepository: ProjectsRepository,
    private readonly storageService: StorageService,
  ) {}

  /**
   * Get paginated list of projects with filtering
   */
  async findAll(query: QueryProjectsDto): Promise<PaginatedResponse<Project>> {
    return this.projectsRepository.findAll({
      page: query.page,
      pageSize: query.pageSize,
      ownerId: query.ownerId,
      status: query.status,
      search: query.search,
      tagIds: query.tagIds,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });
  }

  /**
   * Get project by ID
   */
  async findOne(id: string): Promise<Project> {
    const project = await this.projectsRepository.findOne(id);
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  /**
   * Get project by slug
   */
  async findBySlug(slug: string): Promise<Project> {
    const project = await this.projectsRepository.findBySlug(slug);
    if (!project) {
      throw new NotFoundException(`Project with slug "${slug}" not found`);
    }
    return project;
  }

  /**
   * Create a new project
   */
  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    // Check slug uniqueness
    const isUnique = await this.projectsRepository.isSlugUnique(createProjectDto.slug);
    if (!isUnique) {
      throw new ConflictException(`Project with slug "${createProjectDto.slug}" already exists`);
    }

    const project = await this.projectsRepository.create({
      name: createProjectDto.name,
      slug: createProjectDto.slug,
      description: createProjectDto.description,
      imageUrl: createProjectDto.imageUrl ?? null,
      emoji: createProjectDto.emoji ?? null,
      status: createProjectDto.status || ProjectStatus.ACTIVE,
      ownerId: createProjectDto.ownerId,
      lifecycleStages: createProjectDto.lifecycleStages || [],
      metadata: createProjectDto.metadata || {},
    });

    // Load tags if provided
    if (createProjectDto.tagIds && createProjectDto.tagIds.length > 0) {
      await this.projectsRepository.setProjectTags(project.id, createProjectDto.tagIds);
    }

    return this.findOne(project.id);
  }

  /**
   * Update a project
   */
  async update(id: string, updateProjectDto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);

    // Check slug uniqueness if slug is being updated
    if (updateProjectDto.slug && updateProjectDto.slug !== project.slug) {
      const isUnique = await this.projectsRepository.isSlugUnique(updateProjectDto.slug, id);
      if (!isUnique) {
        throw new ConflictException(`Project with slug "${updateProjectDto.slug}" already exists`);
      }
    }

    const updateData: Partial<Project> = {};
    if (updateProjectDto.name !== undefined) updateData.name = updateProjectDto.name;
    if (updateProjectDto.slug !== undefined) updateData.slug = updateProjectDto.slug;
    if (updateProjectDto.description !== undefined) updateData.description = updateProjectDto.description;
    if (updateProjectDto.imageUrl !== undefined) updateData.imageUrl = updateProjectDto.imageUrl ?? null;
    if (updateProjectDto.emoji !== undefined) updateData.emoji = updateProjectDto.emoji ?? null;
    if (updateProjectDto.status !== undefined) updateData.status = updateProjectDto.status;
    if (updateProjectDto.ownerId !== undefined) updateData.ownerId = updateProjectDto.ownerId;
    if (updateProjectDto.lifecycleStages !== undefined) updateData.lifecycleStages = updateProjectDto.lifecycleStages;
    if (updateProjectDto.metadata !== undefined) updateData.metadata = updateProjectDto.metadata;

    await this.projectsRepository.update(id, updateData);

    // Update tags if provided
    if (updateProjectDto.tagIds !== undefined) {
      await this.projectsRepository.setProjectTags(id, updateProjectDto.tagIds);
    }

    return this.findOne(id);
  }

  /**
   * Soft delete a project
   */
  async remove(id: string): Promise<void> {
    const project = await this.findOne(id);
    await this.projectsRepository.softDelete(id);
  }

  /**
   * Check if project exists
   */
  async exists(id: string): Promise<boolean> {
    return this.projectsRepository.exists(id);
  }

  /**
   * Upload project icon: save file to storage and set project.imageUrl.
   */
  async uploadProjectIcon(projectId: string, file: ProjectIconUpload): Promise<Project> {
    await this.findOne(projectId);
    if (!file.buffer) {
      throw new BadRequestException('No file provided');
    }
    if (!PROJECT_ICON_MIME_TYPES.includes(file.mimetype as (typeof PROJECT_ICON_MIME_TYPES)[number])) {
      throw new BadRequestException(`Invalid file type. Allowed: ${PROJECT_ICON_MIME_TYPES.join(', ')}`);
    }
    if (file.size > PROJECT_ICON_MAX_SIZE_BYTES) {
      throw new BadRequestException(`File too large. Max size: ${PROJECT_ICON_MAX_SIZE_BYTES / 1024 / 1024} MB`);
    }
    const { publicUrl } = await this.storageService.saveProjectIcon(file.buffer, file.mimetype, file.originalname);
    await this.projectsRepository.update(projectId, { imageUrl: publicUrl });
    return this.findOne(projectId);
  }
}
