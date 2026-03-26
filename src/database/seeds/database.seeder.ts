import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@config/config.service';
import { DatabaseService } from '../database.service';
import { runSeed } from './seed.logic';

@Injectable()
export class DatabaseSeeder implements OnApplicationBootstrap {
  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const shouldSeed = this.configService.app.nodeEnv === 'development' || process.env.RUN_SEED === 'true';

    if (!shouldSeed) {
      return;
    }

    await runSeed(this.db);
  }
}
