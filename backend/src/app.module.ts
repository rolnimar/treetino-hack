import { AuthModule } from './auth/auth.module';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthController } from './health/health.controller';
import { IndexerModule } from './indexer/indexer.module';
import { ProtocolModule } from './protocol/protocol.module';

import { VictronModule } from './victron/victron.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    ProtocolModule,
    IndexerModule,
    VictronModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
