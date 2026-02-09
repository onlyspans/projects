import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { Project } from '../projects/entities/project.entity';
import { ProjectGroup } from '../projects/entities/project-group.entity';
import { ProjectLifecycleStageEntity } from '../projects/entities/project-lifecycle-stage.entity';
import { Release } from '../releases/entities/release.entity';
import { getEnvOrThrow, getEnvOrDefault } from '../config/config.utils';

config();

const nodeEnv = getEnvOrDefault('NODE_ENV', 'development');

export default new DataSource({
  type: 'postgres',
  host: getEnvOrThrow('POSTGRES_HOST'),
  port: parseInt(getEnvOrThrow('POSTGRES_PORT'), 10),
  username: getEnvOrThrow('POSTGRES_USER'),
  password: getEnvOrThrow('POSTGRES_PASSWORD'),
  database: getEnvOrThrow('POSTGRES_DB'),
  entities: [Project, ProjectGroup, ProjectLifecycleStageEntity, Release],
  migrations: [join(__dirname, 'migrations', '*.ts')],
  synchronize: false,
  logging: nodeEnv === 'development',
});
