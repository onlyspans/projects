import { registerAs } from '@nestjs/config';
import type { ApplicationConfig } from '../config.interface';
import { getEnvOrThrow } from '../config.utils';

export type { ApplicationConfig };

export function getCorsConfig(): { origin: string[]; credentials: boolean } {
  const corsOrigin = getEnvOrThrow('CORS_ORIGIN');
  return {
    origin: corsOrigin.split(',').map((o) => o.trim()),
    credentials: true,
  };
}

export default registerAs('app', (): ApplicationConfig => {
  return {
    nodeEnv: getEnvOrThrow('NODE_ENV'),
    port: parseInt(getEnvOrThrow('PORT'), 10),
    cors: getCorsConfig(),
  };
});
