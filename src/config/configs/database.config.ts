import { registerAs } from '@nestjs/config';
import { DatabaseConfig, PrismaLogLevel } from '../config.interface';
import { getEnvOrThrow, getEnvOrDefault } from '../config.utils';

function parsePrismaLogLevel(raw: string): PrismaLogLevel {
  const allowed: PrismaLogLevel[] = ['query', 'info', 'warn', 'error'];
  if (allowed.includes(raw as PrismaLogLevel)) {
    return raw as PrismaLogLevel;
  }
  return 'warn';
}

export default registerAs('database', (): DatabaseConfig => {
  return {
    type: 'postgres',
    url: getEnvOrThrow('DATABASE_URL'),
    logQueries: getEnvOrDefault('DB_LOG_QUERIES', 'false') === 'true',
    logLevel: parsePrismaLogLevel(getEnvOrDefault('DB_LOG_LEVEL', 'warn')),
  };
});
