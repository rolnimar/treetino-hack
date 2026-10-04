import { AuthModule } from './auth/auth.module';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthController } from './health/health.controller';
import { IndexerModule } from './indexer/indexer.module';
import { ProtocolModule } from './protocol/protocol.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuthModule,
    ProtocolModule,
    IndexerModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
