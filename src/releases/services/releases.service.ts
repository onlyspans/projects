import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ReleasesRepository } from '../repositories/releases.repository';
import { ProjectsService } from '@projects/services/projects.service';
import { Release, ReleaseStatus } from '../entities/release.entity';
import { CreateReleaseDto } from '../dto/create-release.dto';
import { UpdateReleaseDto } from '../dto/update-release.dto';
import { QueryReleasesDto } from '../dto/query-releases.dto';
import { PaginatedResponse } from '@common/interfaces/paginated-response.interface';
import { ReleaseStructure } from '../interfaces/release-structure.interface';

@Injectable()
export class ReleasesService {
  constructor(
    private readonly releasesRepository: ReleasesRepository,
    private readonly projectsService: ProjectsService,
  ) {}

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
      status: query.status,
      version: query.version,
    });
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
      status: ReleaseStatus.DRAFT,
      changelog: createReleaseDto.changelog,
      notes: createReleaseDto.notes,
      structure: createReleaseDto.structure || {},
      metadata: createReleaseDto.metadata || {},
    });

    return this.findOne(release.id);
  }

  /**
   * Update a release. If projectId is provided, ensures the release belongs to that project.
   */
  async update(id: string, updateReleaseDto: UpdateReleaseDto, projectId?: string): Promise<Release> {
    await this.findOne(id, projectId);

    const updateData: Partial<Release> = {};
    if (updateReleaseDto.status !== undefined) updateData.status = updateReleaseDto.status;
    if (updateReleaseDto.snapshotId !== undefined) updateData.snapshotId = updateReleaseDto.snapshotId;
    if (updateReleaseDto.changelog !== undefined) updateData.changelog = updateReleaseDto.changelog;
    if (updateReleaseDto.notes !== undefined) updateData.notes = updateReleaseDto.notes;
    if (updateReleaseDto.structure !== undefined) updateData.structure = updateReleaseDto.structure;
    if (updateReleaseDto.metadata !== undefined) updateData.metadata = updateReleaseDto.metadata;

    await this.releasesRepository.update(id, updateData);
    return this.findOne(id);
  }

  /**
   * Update release structure (called by snapper)
   */
  async updateStructure(id: string, snapshotId: string, structure: ReleaseStructure): Promise<Release> {
    const release = await this.findOne(id);

    await this.releasesRepository.update(id, {
      snapshotId,
      structure: structure as any,
      status: ReleaseStatus.CREATED,
    });

    return this.findOne(id);
  }

  /**
   * Update release status
   */
  async updateStatus(id: string, status: ReleaseStatus): Promise<Release> {
    await this.findOne(id); // Verify release exists
    await this.releasesRepository.update(id, { status });
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

    if (!release.structure || Object.keys(release.structure).length === 0) {
      throw new NotFoundException(`Release structure not found for release ${id}`);
    }

    return {
      projectId: release.projectId,
      projectName: project.name,
      version: release.version,
      snapshotId: release.snapshotId || '',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      config: (release.structure as any).config || {
        processes: [],
        variables: {},
        assets: [],
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      metadata: (release.structure as any).metadata || {},
    };
  }
}
