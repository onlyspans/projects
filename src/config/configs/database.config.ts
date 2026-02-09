import { registerAs } from '@nestjs/config';
import { DatabaseConfig } from '../config.interface';
import { getEnvOrThrow, getEnvOrDefault } from '../config.utils';

export default registerAs('database', (): DatabaseConfig => {
  return {
    type: 'postgres',
    host: getEnvOrThrow('POSTGRES_HOST'),
    port: parseInt(getEnvOrThrow('POSTGRES_PORT'), 10),
    username: getEnvOrThrow('POSTGRES_USER'),
    password: getEnvOrThrow('POSTGRES_PASSWORD'),
    database: getEnvOrThrow('POSTGRES_DB'),
    synchronize: getEnvOrThrow('NODE_ENV') === 'development',
    autoMigrate: getEnvOrDefault('AUTO_MIGRATE', 'false') === 'true',
  };
});
