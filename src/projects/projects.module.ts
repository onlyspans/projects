import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsController } from './controllers/projects.controller';
import { ProjectsGrpcController } from './grpc/projects.grpc.controller';
import { ProjectsService } from './services/projects.service';
import { ProjectsRepository } from './repositories/projects.repository';
import { Project } from './entities/project.entity';
import { Tag } from '@tags/entities/tag.entity';
import { IsSlugUniqueConstraint } from './validators/is-slug-unique.validator';
import { TagsModule } from '@tags/tags.module';

@Module({
  imports: [TypeOrmModule.forFeature([Project, Tag]), TagsModule],
  controllers: [ProjectsController, ProjectsGrpcController],
  providers: [ProjectsService, ProjectsRepository, IsSlugUniqueConstraint],
  exports: [ProjectsService, ProjectsRepository],
})
export class ProjectsModule {}
