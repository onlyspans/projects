export interface ApplicationConfig {
  nodeEnv: string;
  port: number;
  grpcPort: number;
  cors: {
    origin: string[];
    credentials: boolean;
  };
}

export interface DatabaseConfig {
  type: 'postgres';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize: boolean;
  autoMigrate: boolean;
}

export interface AppConfig {
  app: ApplicationConfig;
  database: DatabaseConfig;
}
