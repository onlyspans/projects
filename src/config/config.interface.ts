export interface ApplicationConfig {
  nodeEnv: string;
  port: number;
  grpcPort: number;
  cors: {
    origin: true;
    methods: string;
    allowedHeaders: string;
    credentials: boolean;
  };
}

export type PrismaLogLevel = 'query' | 'info' | 'warn' | 'error';

export interface DatabaseConfig {
  type: 'postgres';
  url: string;
  logQueries: boolean;
  logLevel: PrismaLogLevel;
}

export interface StorageConfig {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrlBase: string;
}

export interface AppConfig {
  app: ApplicationConfig;
  database: DatabaseConfig;
  storage: StorageConfig;
}
