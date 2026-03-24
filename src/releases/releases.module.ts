import { Module } from '@nestjs/common';
import { ReleasesController } from './controllers/releases.controller';
import { ReleasesGrpcController } from './grpc/releases.grpc.controller';
import { ReleasesService } from './services/releases.service';
import { ReleasesRepository } from './repositories/releases.repository';
import { ProjectsModule } from '@projects/projects.module';

@Module({
  imports: [ProjectsModule],
  controllers: [ReleasesController, ReleasesGrpcController],
  providers: [ReleasesService, ReleasesRepository],
  exports: [ReleasesService, ReleasesRepository],
})
export class ReleasesModule {}
