import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReleasesController } from './controllers/releases.controller';
import { ReleasesGrpcController } from './grpc/releases.grpc.controller';
import { ReleasesService } from './services/releases.service';
import { ReleasesRepository } from './repositories/releases.repository';
import { Release } from './entities/release.entity';
import { Project } from '@projects/entities/project.entity';
import { ProjectsModule } from '@projects/projects.module';

@Module({
  imports: [TypeOrmModule.forFeature([Release, Project]), ProjectsModule],
  controllers: [ReleasesController, ReleasesGrpcController],
  providers: [ReleasesService, ReleasesRepository],
  exports: [ReleasesService, ReleasesRepository],
})
export class ReleasesModule {}
