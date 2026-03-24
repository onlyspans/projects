import { Injectable } from '@nestjs/common';
import { Prisma } from '@database/generated/client';
import { DatabaseService } from '@database/database.service';
import { PaginatedResponse } from '@common/interfaces/paginated-response.interface';
import { calculatePagination, calculateTotalPages } from '@common/utils/pagination.util';
import { releaseWithProjectInclude, type Release } from '../types/release.types';

export interface FindReleasesOptions {
  projectId: string;
  page?: number;
  pageSize?: number;
  version?: string;
}

@Injectable()
export class ReleasesRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAll(options: FindReleasesOptions): Promise<PaginatedResponse<Release>> {
    const { projectId, page = 1, pageSize = 20, version } = options;

    const { skip, take } = calculatePagination(page, pageSize);

    const where: Prisma.ReleaseWhereInput = {
      projectId,
      deletedAt: null,
      ...(version ? { version: { contains: version, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await this.db.$transaction([
      this.db.release.findMany({
        where,
        include: releaseWithProjectInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.db.release.count({ where }),
    ]);

    const totalPages = calculateTotalPages(total, take);

    return {
      items,
      total,
      page,
      pageSize: take,
      totalPages,
    };
  }

  async findOne(id: string): Promise<Release | null> {
    return this.db.release.findFirst({
      where: { id, deletedAt: null },
      include: releaseWithProjectInclude,
    });
  }

  async findByProjectAndVersion(projectId: string, version: string): Promise<Release | null> {
    return this.db.release.findFirst({
      where: { projectId, version, deletedAt: null },
      include: releaseWithProjectInclude,
    });
  }

  async findByProjectId(projectId: string): Promise<Release[]> {
    return this.db.release.findMany({
      where: { projectId, deletedAt: null },
      include: releaseWithProjectInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: {
    projectId: string;
    version: string;
    changelog?: string | null;
    notes?: string | null;
    structure?: Prisma.InputJsonValue;
    metadata?: Prisma.InputJsonValue;
    snapshotId?: string | null;
  }): Promise<Release> {
    return this.db.release.create({
      data: {
        projectId: data.projectId,
        version: data.version,
        changelog: data.changelog ?? null,
        notes: data.notes ?? null,
        structure: data.structure ?? {},
        metadata: data.metadata ?? {},
        snapshotId: data.snapshotId ?? null,
      },
      include: releaseWithProjectInclude,
    });
  }

  async update(
    id: string,
    data: {
      snapshotId?: string | null;
      changelog?: string | null;
      notes?: string | null;
      structure?: Prisma.InputJsonValue;
      metadata?: Prisma.InputJsonValue;
    },
  ): Promise<Release> {
    const patch: Prisma.ReleaseUpdateInput = {};
    if (data.snapshotId !== undefined) patch.snapshotId = data.snapshotId;
    if (data.changelog !== undefined) patch.changelog = data.changelog;
    if (data.notes !== undefined) patch.notes = data.notes;
    if (data.structure !== undefined) patch.structure = data.structure as Prisma.JsonObject;
    if (data.metadata !== undefined) patch.metadata = data.metadata as Prisma.JsonObject;

    await this.db.release.update({
      where: { id },
      data: patch,
    });
    const release = await this.findOne(id);
    if (!release) {
      throw new Error(`Release with ID ${id} not found after update`);
    }
    return release;
  }

  async softDelete(id: string): Promise<void> {
    await this.db.release.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.db.release.count({ where: { id } });
    return count > 0;
  }

  async isVersionUnique(projectId: string, version: string, excludeId?: string): Promise<boolean> {
    const count = await this.db.release.count({
      where: {
        projectId,
        version,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count === 0;
  }

  async verifyProjectExists(projectId: string): Promise<boolean> {
    const count = await this.db.project.count({
      where: { id: projectId, deletedAt: null },
    });
    return count > 0;
  }
}
