import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Tag } from '../entities/tag.entity';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import { calculatePagination, calculateTotalPages } from '../../common/utils/pagination.util';

export interface FindTagsOptions {
  page?: number;
  pageSize?: number;
  search?: string;
}

@Injectable()
export class TagsRepository {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  /**
   * Find all tags with pagination and filtering
   */
  async findAll(options: FindTagsOptions = {}): Promise<PaginatedResponse<Tag>> {
    const { page = 1, pageSize = 20, search } = options;

    const { skip, take } = calculatePagination(page, pageSize);

    const queryBuilder = this.tagRepository.createQueryBuilder('tag');

    if (search) {
      queryBuilder.where('tag.name ILIKE :search', { search: `%${search}%` });
    }

    const [items, total] = await queryBuilder.skip(skip).take(take).orderBy('tag.createdAt', 'DESC').getManyAndCount();

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
   * Find one tag by ID
   */
  async findOne(id: string): Promise<Tag | null> {
    return this.tagRepository.findOne({
      where: { id } as FindOptionsWhere<Tag>,
    });
  }

  /**
   * Find tag by name
   */
  async findByName(name: string): Promise<Tag | null> {
    return this.tagRepository.findOne({
      where: { name } as FindOptionsWhere<Tag>,
    });
  }

  /**
   * Create a new tag
   */
  async create(data: Partial<Tag>): Promise<Tag> {
    const tag = this.tagRepository.create(data);
    return this.tagRepository.save(tag);
  }

  /**
   * Update a tag
   */
  async update(id: string, data: Partial<Tag>): Promise<Tag> {
    await this.tagRepository.update(id, data);
    const tag = await this.findOne(id);
    if (!tag) {
      throw new Error(`Tag with ID ${id} not found after update`);
    }
    return tag;
  }

  /**
   * Delete a tag
   */
  async delete(id: string): Promise<void> {
    await this.tagRepository.delete(id);
  }

  /**
   * Check if tag exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.tagRepository.count({
      where: { id } as FindOptionsWhere<Tag>,
    });
    return count > 0;
  }

  /**
   * Check if tag name is unique
   */
  async isNameUnique(name: string, excludeId?: string): Promise<boolean> {
    const queryBuilder = this.tagRepository.createQueryBuilder('tag').where('tag.name = :name', { name });

    if (excludeId) {
      queryBuilder.andWhere('tag.id != :excludeId', { excludeId });
    }

    const count = await queryBuilder.getCount();
    return count === 0;
  }
}
