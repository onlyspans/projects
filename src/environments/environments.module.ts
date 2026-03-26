import { Module } from '@nestjs/common';
import { EnvironmentsRepository } from './repositories/environments.repository';
import { EnvironmentsService } from './services/environments.service';
import { EnvironmentsController } from './controllers/environments.controller';

@Module({
  controllers: [EnvironmentsController],
  providers: [EnvironmentsRepository, EnvironmentsService],
  exports: [EnvironmentsRepository],
})
export class EnvironmentsModule {}
