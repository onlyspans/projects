import { Module } from '@nestjs/common';
import { ProjectsController } from './controllers/projects.controller';
import { ProjectsGrpcController } from './grpc/projects.grpc.controller';
import { ProjectsService } from './services/projects.service';
import { ProjectsRepository } from './repositories/projects.repository';
import { IsSlugUniqueConstraint } from './validators/is-slug-unique.validator';
import { TagsModule } from '@tags/tags.module';
import { StorageModule } from '@storage/storage.module';
import { EnvironmentsModule } from '@environments/environments.module';

@Module({
  imports: [TagsModule, StorageModule, EnvironmentsModule],
  controllers: [ProjectsController, ProjectsGrpcController],
  providers: [ProjectsService, ProjectsRepository, IsSlugUniqueConstraint],
  exports: [ProjectsService, ProjectsRepository],
})
export class ProjectsModule {}
