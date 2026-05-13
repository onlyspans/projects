import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma } from '@database/generated/client';
import { ReleasesRepository } from '../repositories/releases.repository';
import { ProjectsService } from '@projects/services/projects.service';
import { EnvironmentsRepository } from '@environments/repositories/environments.repository';
import type { Release, ReleaseWithProjectEnvironments } from '../types/release.types';
import { CreateReleaseDto } from '../dto/create-release.dto';
import { UpdateReleaseDto } from '../dto/update-release.dto';
import { QueryReleasesDto, QueryRecentReleasesDto } from '../dto/query-releases.dto';
import { PaginatedResponse } from '@common/interfaces/paginated-response.interface';
import { ReleaseStructure } from '../interfaces/release-structure.interface';

@Injectable()
export class ReleasesService {
  constructor(
    private readonly releasesRepository: ReleasesRepository,
    private readonly projectsService: ProjectsService,
    private readonly environmentsRepository: EnvironmentsRepository,
  ) {}

  private isUniqueConstraintError(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }

  /**
   * Get paginated list of releases for a project
   */
  async findAll(projectId: string, query: QueryReleasesDto): Promise<PaginatedResponse<Release>> {
    // Verify project exists
    const projectExists = await this.projectsService.exists(projectId);
    if (!projectExists) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    return this.releasesRepository.findAll({
      projectId,
      page: query.page,
      pageSize: query.pageSize,
      version: query.version,
    });
  }

  /**
   * Latest release per active project (paginated), with `project.environments` attached.
   */
  async findRecentPerProject(
    query: QueryRecentReleasesDto,
  ): Promise<PaginatedResponse<ReleaseWithProjectEnvironments>> {
    const result = await this.releasesRepository.findRecentPerProject({
      page: query.page,
      pageSize: query.pageSize,
      tagIds: query.tagIds,
      search: query.search,
    });
    await this.environmentsRepository.attachToProjects(result.items.map((r) => r.project));
    return result;
  }

  /**
   * Get release by ID. If projectId is provided, ensures the release belongs to that project.
   */
  async findOne(id: string, projectId?: string): Promise<Release> {
    const release = await this.releasesRepository.findOne(id);
    if (!release) {
      throw new NotFoundException(`Release with ID ${id} not found`);
    }
    if (projectId !== undefined && release.projectId !== projectId) {
      throw new NotFoundException(`Release with ID ${id} not found`);
    }
    return release;
  }

  /**
   * Get active release by (projectId, version).
   */
  async findActiveByProjectAndVersion(projectId: string, version: string): Promise<Release> {
    const projectExists = await this.projectsService.exists(projectId);
    if (!projectExists) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const release = await this.releasesRepository.findByProjectAndVersion(projectId, version);
    if (!release) {
      throw new NotFoundException(`Release with version "${version}" not found for project ${projectId}`);
    }

    return release;
  }

  /**
   * Find or create release by (projectId, version) and return it.
   * Used by snapper to obtain a stable releaseId without relying on side-effects.
   */
  async ensureActiveByProjectAndVersion(
    projectId: string,
    version: string,
    metadata?: Prisma.JsonObject | Record<string, string>,
  ): Promise<Release> {
    const projectExists = await this.projectsService.exists(projectId);
    if (!projectExists) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const existing = await this.releasesRepository.findByProjectAndVersion(projectId, version);
    if (existing) {
      return existing;
    }

    try {
      const created = await this.releasesRepository.create({
        projectId,
        version,
        structure: {} as Prisma.InputJsonValue,
        metadata: (metadata ?? {}) as Prisma.InputJsonValue,
      });

      return this.findOne(created.id);
    } catch (err: unknown) {
      if (!this.isUniqueConstraintError(err)) {
        throw err;
      }

      // Race condition: another request created the same (projectId, version).
      const reread = await this.releasesRepository.findByProjectAndVersion(projectId, version);
      if (!reread) {
        throw new ConflictException(`Release with version "${version}" already exists for this project`);
      }
      return reread;
    }
  }

  /**
   * Create a new release
   */
  async create(projectId: string, createReleaseDto: CreateReleaseDto): Promise<Release> {
    // Verify project exists
    const projectExists = await this.projectsService.exists(projectId);
    if (!projectExists) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // Check version uniqueness
    const isUnique = await this.releasesRepository.isVersionUnique(projectId, createReleaseDto.version);
    if (!isUnique) {
      throw new ConflictException(`Release with version "${createReleaseDto.version}" already exists for this project`);
    }

    const release = await this.releasesRepository.create({
      projectId,
      version: createReleaseDto.version,
      changelog: createReleaseDto.changelog,
      notes: createReleaseDto.notes,
      structure: (createReleaseDto.structure || {}) as Prisma.InputJsonValue,
      metadata: (createReleaseDto.metadata || {}) as Prisma.InputJsonValue,
    });

    return this.findOne(release.id);
  }

  /**
   * Update a release. If projectId is provided, ensures the release belongs to that project.
   */
  async update(id: string, updateReleaseDto: UpdateReleaseDto, projectId?: string): Promise<Release> {
    await this.findOne(id, projectId);

    const updateData: {
      snapshotId?: string | null;
      changelog?: string | null;
      notes?: string | null;
      structure?: Prisma.InputJsonValue;
      metadata?: Prisma.InputJsonValue;
    } = {};
    if (updateReleaseDto.snapshotId !== undefined) updateData.snapshotId = updateReleaseDto.snapshotId;
    if (updateReleaseDto.changelog !== undefined) updateData.changelog = updateReleaseDto.changelog;
    if (updateReleaseDto.notes !== undefined) updateData.notes = updateReleaseDto.notes;
    if (updateReleaseDto.structure !== undefined) {
      updateData.structure = updateReleaseDto.structure as Prisma.InputJsonValue;
    }
    if (updateReleaseDto.metadata !== undefined) {
      updateData.metadata = updateReleaseDto.metadata as Prisma.InputJsonValue;
    }

    await this.releasesRepository.update(id, updateData);
    return this.findOne(id);
  }

  /**
   * Update release structure (called by snapper)
   */
  async updateStructure(id: string, snapshotId: string, structure: ReleaseStructure): Promise<Release> {
    await this.findOne(id);

    await this.releasesRepository.update(id, {
      snapshotId,
      structure: structure as unknown as Prisma.InputJsonValue,
    });

    return this.findOne(id);
  }

  /**
   * Soft delete a release. If projectId is provided, ensures the release belongs to that project.
   */
  async remove(id: string, projectId?: string): Promise<void> {
    await this.findOne(id, projectId);
    await this.releasesRepository.softDelete(id);
  }

  /**
   * Get release structure
   */
  async getStructure(id: string): Promise<ReleaseStructure> {
    const release = await this.findOne(id);
    const project = await this.projectsService.findOne(release.projectId);

    const emptyConfig = {
      processes: [],
      variables: {} as Record<string, string>,
      assets: [],
    };

    const raw = release.structure;
    const hasStoredStructure =
      raw !== null &&
      typeof raw === 'object' &&
      !Array.isArray(raw) &&
      Object.keys(raw as object).length > 0;

    if (!hasStoredStructure) {
      return {
        projectId: release.projectId,
        projectName: project.name,
        version: release.version,
        snapshotId: release.snapshotId || '',
        config: emptyConfig,
        metadata: {},
      };
    }

    return {
      projectId: release.projectId,
      projectName: project.name,
      version: release.version,
      snapshotId: release.snapshotId || '',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      config: (release.structure as any).config || emptyConfig,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      metadata: (release.structure as any).metadata || {},
    };
  }
}
