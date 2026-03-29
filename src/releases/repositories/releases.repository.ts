import { Injectable } from '@nestjs/common';
import { Prisma } from '@database/generated/client';
import { DatabaseService } from '@database/database.service';
import { PaginatedResponse } from '@common/interfaces/paginated-response.interface';
import { calculatePagination, calculateTotalPages } from '@common/utils/pagination.util';
import { releaseWithProjectInclude, type Release } from '../types/release.types';

/** Escape `%`, `_`, and `\` for use in `ILIKE ... ESCAPE '\\'`. */
function escapeIlikePattern(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

export interface FindReleasesOptions {
  projectId: string;
  page?: number;
  pageSize?: number;
  version?: string;
}

export interface FindRecentReleasesOptions {
  page?: number;
  pageSize?: number;
  tagIds?: string[];
  search?: string;
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
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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

  async findRecentPerProject(options: FindRecentReleasesOptions = {}): Promise<PaginatedResponse<Release>> {
    const { page = 1, pageSize = 20, tagIds, search } = options;
    const { skip, take } = calculatePagination(page, pageSize);

    const tagCondition = tagIds?.length
      ? Prisma.sql`AND EXISTS (
          SELECT 1 FROM project_tags pt
          WHERE pt.project_id = p.id AND pt.tag_id IN (${Prisma.join(tagIds)})
        )`
      : Prisma.empty;

    const searchTrimmed = search?.trim();
    const searchCondition = searchTrimmed
      ? Prisma.sql`AND p.name ILIKE ${`%${escapeIlikePattern(searchTrimmed)}%`} ESCAPE '\\'`
      : Prisma.empty;

    const latestCte = Prisma.sql`
      WITH latest AS (
        SELECT DISTINCT ON (r.project_id)
          r.id,
          r.created_at,
          r.id AS sort_id
        FROM releases r
        INNER JOIN projects p ON p.id = r.project_id AND p.deleted_at IS NULL
        WHERE r.deleted_at IS NULL
        ${tagCondition}
        ${searchCondition}
        ORDER BY r.project_id, r.created_at DESC, r.id DESC
      )
    `;

    const [countRows, idRows] = await this.db.$transaction([
      this.db.$queryRaw<{ count: number }[]>(Prisma.sql`
        ${latestCte}
        SELECT COUNT(*)::int AS count FROM latest
      `),
      this.db.$queryRaw<{ id: string }[]>(Prisma.sql`
        ${latestCte}
        SELECT id FROM latest
        ORDER BY created_at DESC, sort_id DESC
        LIMIT ${take} OFFSET ${skip}
      `),
    ]);

    const total = countRows[0]?.count ?? 0;
    const totalPages = calculateTotalPages(total, take);
    const orderedIds = idRows.map((row) => row.id);

    if (orderedIds.length === 0) {
      return {
        items: [],
        total,
        page,
        pageSize: take,
        totalPages,
      };
    }

    const releases = await this.db.release.findMany({
      where: { id: { in: orderedIds } },
      include: releaseWithProjectInclude,
    });
    const byId = new Map(releases.map((r) => [r.id, r]));
    const items = orderedIds.map((id) => {
      const row = byId.get(id);
      if (!row) {
        throw new Error(`Release ${id} not found after recent-per-project query`);
      }
      return row;
    });

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
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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
    const patch: Prisma.ReleaseUpdateManyMutationInput = {};
    if (data.snapshotId !== undefined) patch.snapshotId = data.snapshotId;
    if (data.changelog !== undefined) patch.changelog = data.changelog;
    if (data.notes !== undefined) patch.notes = data.notes;
    if (data.structure !== undefined) patch.structure = data.structure;
    if (data.metadata !== undefined) patch.metadata = data.metadata;

    const updated = await this.db.release.updateManyAndReturn({
      where: { id, deletedAt: null },
      data: patch,
      include: releaseWithProjectInclude,
    });
    if (updated.length === 0) {
      throw new Error(`Release with ID ${id} not found`);
    }
    return updated[0];
  }

  async softDelete(id: string): Promise<void> {
    const result = await this.db.release.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) {
      throw new Error(`Release with ID ${id} not found`);
    }
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.db.release.count({ where: { id, deletedAt: null } });
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
