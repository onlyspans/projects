import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@database/database.service';
import type { Environment } from '@database/generated/client';

export type ProjectWithEnvironmentIds = {
  id: string;
  environmentIds: string[];
  environments?: Environment[];
};

@Injectable()
export class EnvironmentsRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAllActiveOrdered(): Promise<Environment[]> {
    return this.db.environment.findMany({
      where: { deletedAt: null },
      orderBy: { position: 'asc' },
    });
  }

  async findOneActiveById(id: string): Promise<Environment | null> {
    return this.db.environment.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async isPositionTakenByActive(position: number, excludeId?: string): Promise<boolean> {
    const count = await this.db.environment.count({
      where: {
        position,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async create(data: Pick<Environment, 'name' | 'position'> & { description?: string | null }): Promise<Environment> {
    return this.db.environment.create({
      data: {
        name: data.name,
        position: data.position,
        description: data.description ?? null,
      },
    });
  }

  async update(id: string, data: Partial<Pick<Environment, 'name' | 'description' | 'position'>>): Promise<void> {
    await this.db.environment.update({
      where: { id },
      data,
    });
  }

  async findActiveByIdsSorted(ids: string[]): Promise<Environment[]> {
    if (ids.length === 0) {
      return [];
    }
    const unique = [...new Set(ids)];
    return this.db.environment.findMany({
      where: { id: { in: unique }, deletedAt: null },
      orderBy: { position: 'asc' },
    });
  }

  async attachToProjects(projects: ProjectWithEnvironmentIds[]): Promise<void> {
    if (!projects.length) {
      return;
    }
    const allIds = [...new Set(projects.flatMap((p) => p.environmentIds))];
    if (allIds.length === 0) {
      for (const p of projects) {
        p.environments = [];
      }
      return;
    }
    const envs = await this.db.environment.findMany({
      where: { id: { in: allIds }, deletedAt: null },
      orderBy: { position: 'asc' },
    });
    const byId = new Map(envs.map((e) => [e.id, e]));
    for (const p of projects) {
      p.environments = p.environmentIds.map((id) => byId.get(id)).filter((e): e is Environment => e !== undefined);
    }
  }
}
