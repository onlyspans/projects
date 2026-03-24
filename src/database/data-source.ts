import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { Project } from '@projects/entities/project.entity';
import { Tag } from '@tags/entities/tag.entity';
import { Release } from '@releases/entities/release.entity';
import { Environment } from '@environments/entities/environment.entity';
import { getEnvOrThrow, getEnvOrDefault } from '@config/config.utils';

config();

const nodeEnv = getEnvOrDefault('NODE_ENV', 'development');

export default new DataSource({
  type: 'postgres',
  url: getEnvOrThrow('DATABASE_URL'),
  entities: [Project, Tag, Release, Environment],
  migrations: [join(__dirname, 'migrations', '*.ts')],
  synchronize: false,
  logging: nodeEnv === 'development',
});
