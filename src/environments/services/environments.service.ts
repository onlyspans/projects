import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { EnvironmentsRepository } from '../repositories/environments.repository';
import type { Environment } from '@database/generated/client';
import { CreateEnvironmentDto } from '../dto/create-environment.dto';
import { UpdateEnvironmentDto } from '../dto/update-environment.dto';
import { ReorderEnvironmentsDto } from '../dto/reorder-environments.dto';
import { DatabaseService } from '@database/database.service';

@Injectable()
export class EnvironmentsService {
  constructor(
    private readonly environmentsRepository: EnvironmentsRepository,
    private readonly database: DatabaseService,
  ) {}

  async findAll(): Promise<Environment[]> {
    return this.environmentsRepository.findAllActiveOrdered();
  }

  async reorder(dto: ReorderEnvironmentsDto): Promise<Environment[]> {
    const active = await this.environmentsRepository.findAllActiveOrdered();
    if (active.length === 0) {
      if (dto.environmentIds.length > 0) {
        throw new BadRequestException('There are no active environments; send an empty list');
      }
      return [];
    }

    const activeIdSet = new Set(active.map((e) => e.id));
    if (dto.environmentIds.length !== activeIdSet.size) {
      throw new BadRequestException(
        `Expected ${activeIdSet.size} environment ID(s), one per active row; got ${dto.environmentIds.length}`,
      );
    }

    for (const id of dto.environmentIds) {
      if (!activeIdSet.has(id)) {
        throw new BadRequestException(`Unknown or inactive environment ID: ${id}`);
      }
    }

    const orderedIds = dto.environmentIds;

    await this.database.$transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx.environment.update({
          where: { id: orderedIds[i] },
          data: { position: -(i + 1) },
        });
      }
      for (let i = 0; i < orderedIds.length; i++) {
        await tx.environment.update({
          where: { id: orderedIds[i] },
          data: { position: i + 1 },
        });
      }
    });

    return this.environmentsRepository.findAllActiveOrdered();
  }

  async findOne(id: string): Promise<Environment> {
    const env = await this.environmentsRepository.findOneActiveById(id);
    if (!env) {
      throw new NotFoundException(`Environment with ID ${id} not found`);
    }
    return env;
  }

  async create(dto: CreateEnvironmentDto): Promise<Environment> {
    const taken = await this.environmentsRepository.isPositionTakenByActive(dto.position);
    if (taken) {
      throw new ConflictException(`An active environment already uses position ${dto.position}`);
    }

    return this.environmentsRepository.create({
      name: dto.name,
      description: dto.description ?? null,
      position: dto.position,
    });
  }

  async update(id: string, dto: UpdateEnvironmentDto): Promise<Environment> {
    await this.findOne(id);

    if (dto.position !== undefined) {
      const taken = await this.environmentsRepository.isPositionTakenByActive(dto.position, id);
      if (taken) {
        throw new ConflictException(`An active environment already uses position ${dto.position}`);
      }
    }

    const updateData: { name?: string; description?: string | null; position?: number } = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description ?? null;
    if (dto.position !== undefined) updateData.position = dto.position;

    await this.environmentsRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

    await this.database.$transaction(async (tx) => {
      await tx.environment.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      const projects = await tx.project.findMany({
        where: { deletedAt: null },
      });
      for (const p of projects) {
        const ids = p.environmentIds ?? [];
        if (!ids.includes(id)) {
          continue;
        }
        await tx.project.update({
          where: { id: p.id },
          data: {
            environmentIds: ids.filter((x) => x !== id),
          },
        });
      }
    });
  }
}
