import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@config/config.module';
import { DatabaseModule } from '@database/database.module';
import { ProjectsModule } from '@projects/projects.module';
import { ReleasesModule } from '@releases/releases.module';
import { TagsModule } from '@tags/tags.module';
import { EnvironmentsModule } from '@environments/environments.module';

@Module({
  imports: [ConfigModule, DatabaseModule, TagsModule, EnvironmentsModule, ProjectsModule, ReleasesModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
