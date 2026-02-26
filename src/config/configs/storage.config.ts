import { registerAs } from '@nestjs/config';
import type { StorageConfig } from '../config.interface';
import { getEnvOrThrow, getEnvOrDefault } from '../config.utils';

export default registerAs('storage', (): StorageConfig => {
  const bucket = getEnvOrThrow('S3_BUCKET');
  const endpoint = getEnvOrDefault('S3_ENDPOINT', 'https://storage.yandexcloud.net');
  const region = getEnvOrDefault('S3_REGION', 'ru-central1');
  const accessKeyId = getEnvOrThrow('S3_ACCESS_KEY_ID');
  const secretAccessKey = getEnvOrThrow('S3_SECRET_ACCESS_KEY');
  const publicUrlBase = process.env.S3_PUBLIC_URL_BASE || `${endpoint.replace(/\/$/, '')}/${bucket}`;
  return {
    endpoint,
    region,
    bucket,
    accessKeyId,
    secretAccessKey,
    publicUrlBase,
  };
});
