import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { ProjectsModule } from './projects/projects.module';
import { ReleasesModule } from './releases/releases.module';
import { TagsModule } from './tags/tags.module';

@Module({
  imports: [ConfigModule, DatabaseModule, TagsModule, ProjectsModule, ReleasesModule],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
