import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'src/database/schema.prisma',
  migrations: {
    path: 'src/database/migrations',
    seed: 'bun src/database/seeds/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
