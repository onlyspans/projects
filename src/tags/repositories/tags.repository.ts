import { Injectable } from '@nestjs/common';
import { Prisma } from '@database/generated/client';
import { DatabaseService } from '@database/database.service';
import type { Tag } from '@database/generated/client';
import { PaginatedResponse } from '@common/interfaces/paginated-response.interface';
import { calculatePagination, calculateTotalPages } from '@common/utils/pagination.util';

export interface FindTagsOptions {
  page?: number;
  pageSize?: number;
  search?: string;
}

@Injectable()
export class TagsRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAll(options: FindTagsOptions = {}): Promise<PaginatedResponse<Tag>> {
    const { page = 1, pageSize = 20, search } = options;

    const { skip, take } = calculatePagination(page, pageSize);

    const where: Prisma.TagWhereInput = search ? { name: { contains: search, mode: 'insensitive' } } : {};

    const [items, total] = await this.db.$transaction([
      this.db.tag.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.db.tag.count({ where }),
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

  async findOne(id: string): Promise<Tag | null> {
    return this.db.tag.findUnique({ where: { id } });
  }

  async findByName(name: string): Promise<Tag | null> {
    return this.db.tag.findUnique({ where: { name } });
  }

  async create(data: { name: string; description?: string | null; color?: string | null }): Promise<Tag> {
    return this.db.tag.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        color: data.color ?? null,
      },
    });
  }

  async update(id: string, data: { name?: string; description?: string | null; color?: string | null }): Promise<Tag> {
    await this.db.tag.update({
      where: { id },
      data,
    });
    const tag = await this.findOne(id);
    if (!tag) {
      throw new Error(`Tag with ID ${id} not found after update`);
    }
    return tag;
  }

  async delete(id: string): Promise<void> {
    await this.db.tag.delete({ where: { id } });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.db.tag.count({ where: { id } });
    return count > 0;
  }

  async isNameUnique(name: string, excludeId?: string): Promise<boolean> {
    const count = await this.db.tag.count({
      where: {
        name,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count === 0;
  }
}
