import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@config/config.service';
import { Tag } from '@tags/entities/tag.entity';
import { Project } from '@projects/entities/project.entity';
import { Release } from '@releases/entities/release.entity';
import { ProjectStatus, LifecycleStage } from '@projects/entities/project.entity';
import { ReleaseStatus } from '@releases/entities/release.entity';

@Injectable()
export class DatabaseSeeder implements OnApplicationBootstrap {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const shouldSeed =
      this.configService.app.nodeEnv === 'development' ||
      process.env.RUN_SEED === 'true';

    if (!shouldSeed) {
      return;
    }

    await this.seedIfEmpty();
  }

  private async seedIfEmpty(): Promise<void> {
    const projectRepo = this.dataSource.getRepository(Project);
    const existing = await projectRepo.count();
    if (existing > 0) {
      return;
    }

    const tagRepo = this.dataSource.getRepository(Tag);
    const releaseRepo = this.dataSource.getRepository(Release);

    const tags = await this.seedTags(tagRepo);
    const projects = await this.seedProjects(projectRepo, tags);
    await this.seedReleases(releaseRepo, projects);

    console.log('🌱 Database seeded with sample data');
  }

  private async seedTags(repo: Repository<Tag>) {
    const data = [
      { name: 'web', description: 'Web applications', color: '#3b82f6' },
      { name: 'mobile', description: 'Mobile apps', color: '#22c55e' },
      { name: 'api', description: 'Backend APIs', color: '#8b5cf6' },
      { name: 'demo', description: 'Demo / sample projects', color: '#f59e0b' },
    ];
    const entities = repo.create(data);
    return repo.save(entities);
  }

  private async seedProjects(repo: Repository<Project>, tags: Tag[]) {
    const [tagWeb, tagMobile, tagApi, tagDemo] = tags;
    const data = [
      {
        name: 'Sample Web App',
        slug: 'sample-web-app',
        description: 'Example web application for development',
        status: ProjectStatus.ACTIVE,
        ownerId: null,
        lifecycleStages: [LifecycleStage.DEVELOPMENT, LifecycleStage.STAGING],
        metadata: {},
        tags: [tagWeb, tagDemo],
      },
      {
        name: 'Mobile SDK',
        slug: 'mobile-sdk',
        description: 'Mobile SDK and tooling',
        status: ProjectStatus.ACTIVE,
        ownerId: null,
        lifecycleStages: [LifecycleStage.DEVELOPMENT],
        metadata: {},
        tags: [tagMobile, tagApi],
      },
      {
        name: 'Public API',
        slug: 'public-api',
        description: 'Public REST and gRPC API',
        status: ProjectStatus.ACTIVE,
        ownerId: null,
        lifecycleStages: [LifecycleStage.STAGING, LifecycleStage.PRODUCTION],
        metadata: {},
        tags: [tagApi],
      },
    ];
    const entities = repo.create(data);
    return repo.save(entities);
  }

  private async seedReleases(repo: Repository<Release>, projects: Project[]) {
    const [project1, project2] = projects;
    const data = [
      {
        projectId: project1.id,
        version: '1.0.0',
        snapshotId: null,
        status: ReleaseStatus.DEPLOYED,
        changelog: 'Initial release',
        notes: null,
        structure: {},
        metadata: {},
      },
      {
        projectId: project1.id,
        version: '1.1.0',
        snapshotId: null,
        status: ReleaseStatus.DRAFT,
        changelog: null,
        notes: 'WIP',
        structure: {},
        metadata: {},
      },
      {
        projectId: project2.id,
        version: '0.1.0',
        snapshotId: null,
        status: ReleaseStatus.CREATED,
        changelog: 'Alpha release',
        notes: null,
        structure: {},
        metadata: {},
      },
    ];
    const entities = repo.create(data);
    await repo.save(entities);
  }
}
