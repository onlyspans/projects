import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { Project } from '../projects/entities/project.entity';
import { ProjectGroup } from '../projects/entities/project-group.entity';
import { ProjectLifecycleStageEntity } from '../projects/entities/project-lifecycle-stage.entity';
import { Release } from '../releases/entities/release.entity';
import { ConfigService } from '../config/config.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.database;
        const appConfig = configService.app;
        const isDevelopment = appConfig.nodeEnv === 'development';

        return {
          type: 'postgres',
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.database,
          entities: [Project, ProjectGroup, ProjectLifecycleStageEntity, Release],
          synchronize: dbConfig.synchronize,
          logging: isDevelopment,
          migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
          migrationsRun: dbConfig.autoMigrate,
          migrationsTableName: 'migrations',
        };
      },
    }),
  ],
})
export class DatabaseModule {}
