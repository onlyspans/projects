import { registerAs } from '@nestjs/config';
import { DatabaseConfig } from '../config.interface';
import { getEnvOrThrow } from '../config.utils';

export default registerAs('database', (): DatabaseConfig => {
  return {
    type: 'postgres',
    host: getEnvOrThrow('POSTGRES_HOST'),
    port: parseInt(getEnvOrThrow('POSTGRES_PORT'), 10),
    username: getEnvOrThrow('POSTGRES_USER'),
    password: getEnvOrThrow('POSTGRES_PASSWORD'),
    database: getEnvOrThrow('POSTGRES_DB'),
    synchronize: process.env.NODE_ENV !== 'production',
  };
});
