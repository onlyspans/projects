import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { TagsRepository } from '../repositories/tags.repository';
import { Tag } from '../entities/tag.entity';
import { CreateTagDto } from '../dto/create-tag.dto';
import { UpdateTagDto } from '../dto/update-tag.dto';
import { QueryTagsDto } from '../dto/query-tags.dto';
import { PaginatedResponse } from '@common/interfaces/paginated-response.interface';

@Injectable()
export class TagsService {
  constructor(private readonly tagsRepository: TagsRepository) {}

  /**
   * Get paginated list of tags with filtering
   */
  async findAll(query: QueryTagsDto): Promise<PaginatedResponse<Tag>> {
    return this.tagsRepository.findAll({
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
    });
  }

  /**
   * Get tag by ID
   */
  async findOne(id: string): Promise<Tag> {
    const tag = await this.tagsRepository.findOne(id);
    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }
    return tag;
  }

  /**
   * Create a new tag
   */
  async create(createTagDto: CreateTagDto): Promise<Tag> {
    // Check name uniqueness
    const isUnique = await this.tagsRepository.isNameUnique(createTagDto.name);
    if (!isUnique) {
      throw new ConflictException(`Tag with name "${createTagDto.name}" already exists`);
    }

    return this.tagsRepository.create({
      name: createTagDto.name,
      description: createTagDto.description,
      color: createTagDto.color,
    });
  }

  /**
   * Update a tag
   */
  async update(id: string, updateTagDto: UpdateTagDto): Promise<Tag> {
    const tag = await this.findOne(id);

    // Check name uniqueness if name is being updated
    if (updateTagDto.name && updateTagDto.name !== tag.name) {
      const isUnique = await this.tagsRepository.isNameUnique(updateTagDto.name, id);
      if (!isUnique) {
        throw new ConflictException(`Tag with name "${updateTagDto.name}" already exists`);
      }
    }

    const updateData: Partial<Tag> = {};
    if (updateTagDto.name !== undefined) updateData.name = updateTagDto.name;
    if (updateTagDto.description !== undefined) updateData.description = updateTagDto.description;
    if (updateTagDto.color !== undefined) updateData.color = updateTagDto.color;

    await this.tagsRepository.update(id, updateData);
    return this.findOne(id);
  }

  /**
   * Delete a tag
   */
  async remove(id: string): Promise<void> {
    await this.findOne(id); // Verify tag exists
    await this.tagsRepository.delete(id);
  }
}
