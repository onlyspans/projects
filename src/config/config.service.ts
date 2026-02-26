import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { appConfig, databaseConfig, storageConfig } from './configs';
import type { StorageConfig } from './config.interface';

@Injectable()
export class ConfigService {
  constructor(
    @Inject(appConfig.KEY)
    private readonly appConfiguration: ConfigType<typeof appConfig>,
    @Inject(databaseConfig.KEY)
    private readonly databaseConfiguration: ConfigType<typeof databaseConfig>,
    @Inject(storageConfig.KEY)
    private readonly storageConfiguration: ConfigType<typeof storageConfig>,
  ) {}

  get app() {
    return this.appConfiguration;
  }

  get database() {
    return this.databaseConfiguration;
  }

  get storage(): StorageConfig {
    return this.storageConfiguration;
  }
}
