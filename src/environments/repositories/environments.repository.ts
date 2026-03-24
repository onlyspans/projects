import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { Environment } from '../entities/environment.entity';
import { Project } from '@projects/entities/project.entity';

@Injectable()
export class EnvironmentsRepository {
  constructor(
    @InjectRepository(Environment)
    private readonly environmentRepository: Repository<Environment>,
  ) {}

  async findAllActiveOrdered(): Promise<Environment[]> {
    return this.environmentRepository.find({
      where: { deletedAt: IsNull() },
      order: { position: 'ASC' },
    });
  }

  async findOneActiveById(id: string): Promise<Environment | null> {
    return this.environmentRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  async isPositionTakenByActive(position: number, excludeId?: string): Promise<boolean> {
    const qb = this.environmentRepository
      .createQueryBuilder('e')
      .where('e.position = :position', { position })
      .andWhere('e.deleted_at IS NULL');
    if (excludeId) {
      qb.andWhere('e.id != :excludeId', { excludeId });
    }
    const count = await qb.getCount();
    return count > 0;
  }

  async create(data: Partial<Environment>): Promise<Environment> {
    const entity = this.environmentRepository.create(data);
    return this.environmentRepository.save(entity);
  }

  async update(id: string, data: Partial<Environment>): Promise<void> {
    await this.environmentRepository.update(id, data);
  }

  async findActiveByIdsSorted(ids: string[]): Promise<Environment[]> {
    if (ids.length === 0) {
      return [];
    }
    const unique = [...new Set(ids)];
    return this.environmentRepository.find({
      where: { id: In(unique), deletedAt: IsNull() },
      order: { position: 'ASC' },
    });
  }

  async attachToProjects(projects: Project[]): Promise<void> {
    if (!projects.length) {
      return;
    }
    const allIds = [...new Set(projects.flatMap((p) => p.environmentIds ?? []))];
    if (allIds.length === 0) {
      for (const p of projects) {
        p.environments = [];
      }
      return;
    }
    const envs = await this.environmentRepository.find({
      where: { id: In(allIds), deletedAt: IsNull() },
      order: { position: 'ASC' },
    });
    const byId = new Map(envs.map((e) => [e.id, e]));
    for (const p of projects) {
      p.environments = (p.environmentIds ?? [])
        .map((id) => byId.get(id))
        .filter((e): e is Environment => e !== undefined);
    }
  }
}
