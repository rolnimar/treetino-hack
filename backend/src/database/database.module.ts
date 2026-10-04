import { Module } from '@nestjs/common';
import { DatabaseConfig } from './database.config';
import { DatabaseService } from './database.service';

@Module({
  providers: [
    DatabaseConfig,
    {
      provide: DatabaseService,
      inject: [DatabaseConfig],
      useFactory: (config: DatabaseConfig) => DatabaseService.create(config),
    },
  ],
  exports: [DatabaseService],
})
export class DatabaseModule {}
