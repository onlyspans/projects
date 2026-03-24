import { Injectable } from '@nestjs/common';
import { Prisma } from '@database/generated/client';
import { DatabaseService } from '@database/database.service';
import { serializeEnvironmentIds } from '@database/environment-ids';
import { PaginatedResponse } from '@common/interfaces/paginated-response.interface';
import { calculatePagination, calculateTotalPages } from '@common/utils/pagination.util';
import { ProjectStatus } from '@database/generated/client';
import type { Project } from '../types/project.types';

const projectWithTagsInclude = {
  projectTags: { include: { tag: true } },
} satisfies Prisma.ProjectInclude;

type ProjectRow = Prisma.ProjectGetPayload<{ include: typeof projectWithTagsInclude }>;

function toProject(row: ProjectRow): Project {
  const { projectTags, ...rest } = row;
  return {
    ...rest,
    tags: projectTags.map((pt) => pt.tag),
  };
}

export interface FindProjectsOptions {
  page?: number;
  pageSize?: number;
  ownerId?: string;
  status?: ProjectStatus;
  search?: string;
  tagIds?: string[];
  sortBy?: 'name' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class ProjectsRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAll(options: FindProjectsOptions = {}): Promise<PaginatedResponse<Project>> {
    const {
      page = 1,
      pageSize = 20,
      ownerId,
      status,
      search,
      tagIds,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const { skip, take } = calculatePagination(page, pageSize);

    const where: Prisma.ProjectWhereInput = {
      deletedAt: null,
      ...(ownerId ? { ownerId } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { slug: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(tagIds?.length
        ? {
            projectTags: { some: { tagId: { in: tagIds } } },
          }
        : {}),
    };

    const orderBy: Prisma.ProjectOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [rows, total] = await this.db.$transaction([
      this.db.project.findMany({
        where,
        include: projectWithTagsInclude,
        orderBy,
        skip,
        take,
      }),
      this.db.project.count({ where }),
    ]);

    const totalPages = calculateTotalPages(total, take);

    return {
      items: rows.map(toProject),
      total,
      page,
      pageSize: take,
      totalPages,
    };
  }

  async findOne(id: string): Promise<Project | null> {
    const row = await this.db.project.findFirst({
      where: { id, deletedAt: null },
      include: projectWithTagsInclude,
    });
    return row ? toProject(row) : null;
  }

  async findBySlug(slug: string): Promise<Project | null> {
    const row = await this.db.project.findFirst({
      where: { slug, deletedAt: null },
      include: projectWithTagsInclude,
    });
    return row ? toProject(row) : null;
  }

  async create(data: {
    name: string;
    slug: string;
    description?: string | null;
    imageUrl?: string | null;
    emoji?: string | null;
    status?: ProjectStatus;
    ownerId?: string | null;
    environmentIds: string[] | string;
    metadata?: Prisma.InputJsonValue;
  }): Promise<Project> {
    const environmentIds =
      typeof data.environmentIds === 'string' ? data.environmentIds : serializeEnvironmentIds(data.environmentIds);

    const row = await this.db.project.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        imageUrl: data.imageUrl ?? null,
        emoji: data.emoji ?? null,
        status: data.status ?? ProjectStatus.active,
        ownerId: data.ownerId ?? null,
        environmentIds,
        metadata: data.metadata ?? {},
      },
      include: projectWithTagsInclude,
    });
    return toProject(row);
  }

  async update(
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string | null;
      imageUrl?: string | null;
      emoji?: string | null;
      status?: ProjectStatus;
      ownerId?: string | null;
      environmentIds?: string[] | string;
      metadata?: Prisma.InputJsonValue;
    },
  ): Promise<Project> {
    const updateData: Prisma.ProjectUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.emoji !== undefined) updateData.emoji = data.emoji;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.ownerId !== undefined) updateData.ownerId = data.ownerId;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;
    if (data.environmentIds !== undefined) {
      updateData.environmentIds =
        typeof data.environmentIds === 'string' ? data.environmentIds : serializeEnvironmentIds(data.environmentIds);
    }

    await this.db.project.update({
      where: { id },
      data: updateData,
    });

    const project = await this.findOne(id);
    if (!project) {
      throw new Error(`Project with ID ${id} not found after update`);
    }
    return project;
  }

  async softDelete(id: string): Promise<void> {
    await this.db.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.db.project.count({
      where: { id, deletedAt: null },
    });
    return count > 0;
  }

  async isSlugUnique(slug: string, excludeId?: string): Promise<boolean> {
    const count = await this.db.project.count({
      where: {
        slug,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count === 0;
  }

  async setProjectTags(projectId: string, tagIds: string[]): Promise<void> {
    await this.db.$transaction(async (tx) => {
      await tx.projectTag.deleteMany({ where: { projectId } });
      if (tagIds.length === 0) return;
      await tx.projectTag.createMany({
        data: tagIds.map((tagId) => ({ projectId, tagId })),
        skipDuplicates: true,
      });
    });
  }
}
