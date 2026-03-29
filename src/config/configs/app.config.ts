import { registerAs } from '@nestjs/config';
import type { ApplicationConfig } from '../config.interface';
import { getEnvOrThrow } from '../config.utils';

export type { ApplicationConfig };

export function getCorsConfig(): {
  origin: true;
  methods: string;
  allowedHeaders: string;
  credentials: boolean;
} {
  return {
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: '*',
    credentials: true,
  };
}

export default registerAs('app', (): ApplicationConfig => {
  return {
    nodeEnv: getEnvOrThrow('NODE_ENV'),
    port: parseInt(getEnvOrThrow('PORT'), 10),
    grpcPort: parseInt(getEnvOrThrow('GRPC_PORT'), 10),
    cors: getCorsConfig(),
  };
});
