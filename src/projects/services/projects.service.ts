import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ProjectsRepository } from '../repositories/projects.repository';
import { Project, ProjectStatus } from '../entities/project.entity';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { QueryProjectsDto } from '../dto/query-projects.dto';
import { PaginatedResponse } from '@common/interfaces/paginated-response.interface';

@Injectable()
export class ProjectsService {
  constructor(private readonly projectsRepository: ProjectsRepository) {}

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
}
