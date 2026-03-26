import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/client';
import { runSeed } from './seed.logic';

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is required for seeding');
  }

  const adapter = new PrismaPg({ connectionString: url });
  const db = new PrismaClient({
    adapter,
    log: ['warn', 'error'],
  });

  await db.$connect();
  try {
    await runSeed(db);
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
