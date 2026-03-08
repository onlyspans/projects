import { registerAs } from '@nestjs/config';
import { DatabaseConfig } from '../config.interface';
import { getEnvOrThrow, getEnvOrDefault } from '../config.utils';

export default registerAs('database', (): DatabaseConfig => {
  return {
    type: 'postgres',
    url: getEnvOrThrow('DATABASE_URL'),
    synchronize: true,
    autoMigrate: getEnvOrDefault('AUTO_MIGRATE', 'false') === 'true',
  };
});
