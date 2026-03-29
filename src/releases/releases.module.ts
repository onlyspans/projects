import { Module } from '@nestjs/common';
import { ReleasesController } from './controllers/releases.controller';
import { RecentReleasesController } from './controllers/recent-releases.controller';
import { ReleasesGrpcController } from './grpc/releases.grpc.controller';
import { ReleasesService } from './services/releases.service';
import { ReleasesRepository } from './repositories/releases.repository';
import { ProjectsModule } from '@projects/projects.module';
import { EnvironmentsModule } from '@environments/environments.module';

@Module({
  imports: [ProjectsModule, EnvironmentsModule],
  controllers: [ReleasesController, RecentReleasesController, ReleasesGrpcController],
  providers: [ReleasesService, ReleasesRepository],
  exports: [ReleasesService, ReleasesRepository],
})
export class ReleasesModule {}
