import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from './generated/client';
import { ConfigService } from '@config/config.service';
import type { PrismaLogLevel } from '@config/config.interface';

function buildPrismaLog(db: { logQueries: boolean; logLevel: PrismaLogLevel }): Prisma.LogLevel[] {
  const levels = new Set<Prisma.LogLevel>(['error', 'warn']);
  levels.add(db.logLevel);
  if (db.logQueries) {
    levels.add('query');
  }
  return Array.from(levels);
}

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly configService: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: configService.database.url,
    });
    super({
      adapter,
      log: buildPrismaLog(configService.database),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
