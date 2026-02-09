import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In } from 'typeorm';
import { Project, ProjectStatus } from '../entities/project.entity';
import { Tag } from '@tags/entities/tag.entity';
import { PaginatedResponse } from '@common/interfaces/paginated-response.interface';
import { calculatePagination, calculateTotalPages } from '@common/utils/pagination.util';

export interface FindProjectsOptions {
  page?: number;
  pageSize?: number;
  ownerId?: string;
  status?: ProjectStatus;
  search?: string;
  tagIds?: string[];
}

@Injectable()
export class ProjectsRepository {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  /**
   * Find all projects with pagination and filtering
   */
  async findAll(options: FindProjectsOptions = {}): Promise<PaginatedResponse<Project>> {
    const { page = 1, pageSize = 20, ownerId, status, search, tagIds } = options;

    const { skip, take } = calculatePagination(page, pageSize);

    const queryBuilder = this.projectRepository
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.tags', 'tags')
      .where('project.deletedAt IS NULL');

    if (ownerId) {
      queryBuilder.andWhere('project.ownerId = :ownerId', { ownerId });
    }

    if (status) {
      queryBuilder.andWhere('project.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(project.name ILIKE :search OR project.slug ILIKE :search OR project.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (tagIds && tagIds.length > 0) {
      queryBuilder.andWhere('tags.id IN (:...tagIds)', { tagIds });
    }

    const [items, total] = await queryBuilder
      .skip(skip)
      .take(take)
      .orderBy('project.createdAt', 'DESC')
      .getManyAndCount();

    const totalPages = calculateTotalPages(total, take);

    return {
      items,
      total,
      page,
      pageSize: take,
      totalPages,
    };
  }

  /**
   * Find one project by ID
   */
  async findOne(id: string): Promise<Project | null> {
    return this.projectRepository.findOne({
      where: { id } as FindOptionsWhere<Project>,
      relations: ['tags'],
    });
  }

  /**
   * Find project by slug
   */
  async findBySlug(slug: string): Promise<Project | null> {
    return this.projectRepository.findOne({
      where: { slug } as FindOptionsWhere<Project>,
      relations: ['tags'],
    });
  }

  /**
   * Create a new project
   */
  async create(data: Partial<Project>): Promise<Project> {
    const project = this.projectRepository.create(data);
    return this.projectRepository.save(project);
  }

  /**
   * Update a project
   */
  async update(id: string, data: Partial<Project>): Promise<Project> {
    await this.projectRepository.update(id, data);
    const project = await this.findOne(id);
    if (!project) {
      throw new Error(`Project with ID ${id} not found after update`);
    }
    return project;
  }

  /**
   * Soft delete a project
   */
  async softDelete(id: string): Promise<void> {
    await this.projectRepository.softDelete(id);
  }

  /**
   * Check if project exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.projectRepository.count({
      where: { id } as FindOptionsWhere<Project>,
    });
    return count > 0;
  }

  /**
   * Check if slug is unique
   */
  async isSlugUnique(slug: string, excludeId?: string): Promise<boolean> {
    const queryBuilder = this.projectRepository
      .createQueryBuilder('project')
      .where('project.slug = :slug', { slug })
      .andWhere('project.deletedAt IS NULL');

    if (excludeId) {
      queryBuilder.andWhere('project.id != :excludeId', { excludeId });
    }

    const count = await queryBuilder.getCount();
    return count === 0;
  }

  /**
   * Load tags for project
   */
  async loadTags(project: Project, tagIds: string[]): Promise<void> {
    if (tagIds && tagIds.length > 0) {
      const tags = await this.tagRepository.find({
        where: { id: In(tagIds) },
      });
      project.tags = tags;
    } else {
      project.tags = [];
    }
  }
}
