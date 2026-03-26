import { Global, Module } from '@nestjs/common';
import { DatabaseSeeder } from './seeds/database.seeder';
import { DatabaseService } from './database.service';

@Global()
@Module({
  imports: [],
  providers: [DatabaseService, DatabaseSeeder],
  exports: [DatabaseService],
})
export class DatabaseModule {}
