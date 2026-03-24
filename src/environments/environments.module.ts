import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Environment } from './entities/environment.entity';
import { Project } from '@projects/entities/project.entity';
import { EnvironmentsRepository } from './repositories/environments.repository';
import { EnvironmentsService } from './services/environments.service';
import { EnvironmentsController } from './controllers/environments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Environment, Project])],
  controllers: [EnvironmentsController],
  providers: [EnvironmentsRepository, EnvironmentsService],
  exports: [EnvironmentsRepository],
})
export class EnvironmentsModule {}
