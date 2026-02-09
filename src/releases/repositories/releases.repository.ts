import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Release, ReleaseStatus } from '../entities/release.entity';
import { Project } from '../../projects/entities/project.entity';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { calculatePagination, calculateTotalPages } from '../../common/utils/pagination.util';

export interface FindReleasesOptions {
  projectId: string;
  page?: number;
  pageSize?: number;
  status?: ReleaseStatus;
  version?: string;
}

@Injectable()
export class ReleasesRepository {
  constructor(
    @InjectRepository(Release)
    private readonly releaseRepository: Repository<Release>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  /**
   * Find all releases for a project with pagination and filtering
   */
  async findAll(options: FindReleasesOptions): Promise<PaginatedResponse<Release>> {
    const { projectId, page = 1, pageSize = 20, status, version } = options;

    const { skip, take } = calculatePagination(page, pageSize);

    const queryBuilder = this.releaseRepository
      .createQueryBuilder('release')
      .leftJoinAndSelect('release.project', 'project')
      .where('release.projectId = :projectId', { projectId })
      .andWhere('release.deletedAt IS NULL');

    if (status) {
      queryBuilder.andWhere('release.status = :status', { status });
    }

    if (version) {
      queryBuilder.andWhere('release.version ILIKE :version', {
        version: `%${version}%`,
      });
    }

    const [items, total] = await queryBuilder
      .skip(skip)
      .take(take)
      .orderBy('release.createdAt', 'DESC')
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
   * Find one release by ID
   */
  async findOne(id: string): Promise<Release | null> {
    return this.releaseRepository.findOne({
      where: { id } as FindOptionsWhere<Release>,
      relations: ['project'],
    });
  }

  /**
   * Find release by project ID and version
   */
  async findByProjectAndVersion(projectId: string, version: string): Promise<Release | null> {
    return this.releaseRepository.findOne({
      where: {
        projectId,
        version,
      } as FindOptionsWhere<Release>,
      relations: ['project'],
    });
  }

  /**
   * Find all releases for a project
   */
  async findByProjectId(projectId: string): Promise<Release[]> {
    return this.releaseRepository.find({
      where: { projectId } as FindOptionsWhere<Release>,
      relations: ['project'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Create a new release
   */
  async create(data: Partial<Release>): Promise<Release> {
    const release = this.releaseRepository.create(data);
    return this.releaseRepository.save(release);
  }

  /**
   * Update a release
   */
  async update(id: string, data: Partial<Release>): Promise<Release> {
    await this.releaseRepository.update(id, data);
    const release = await this.findOne(id);
    if (!release) {
      throw new Error(`Release with ID ${id} not found after update`);
    }
    return release;
  }

  /**
   * Soft delete a release
   */
  async softDelete(id: string): Promise<void> {
    await this.releaseRepository.softDelete(id);
  }

  /**
   * Check if release exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.releaseRepository.count({
      where: { id } as FindOptionsWhere<Release>,
    });
    return count > 0;
  }

  /**
   * Check if version is unique for a project
   */
  async isVersionUnique(projectId: string, version: string, excludeId?: string): Promise<boolean> {
    const queryBuilder = this.releaseRepository
      .createQueryBuilder('release')
      .where('release.projectId = :projectId', { projectId })
      .andWhere('release.version = :version', { version })
      .andWhere('release.deletedAt IS NULL');

    if (excludeId) {
      queryBuilder.andWhere('release.id != :excludeId', { excludeId });
    }

    const count = await queryBuilder.getCount();
    return count === 0;
  }

  /**
   * Verify project exists
   */
  async verifyProjectExists(projectId: string): Promise<boolean> {
    const count = await this.projectRepository.count({
      where: { id: projectId } as FindOptionsWhere<Project>,
    });
    return count > 0;
  }
}
