import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Environment } from './entities/environment.entity';
import { EnvironmentsRepository } from './repositories/environments.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Environment])],
  providers: [EnvironmentsRepository],
  exports: [EnvironmentsRepository],
})
export class EnvironmentsModule {}
