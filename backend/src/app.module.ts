import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';
import { ProtocolModule } from './protocol/protocol.module';

@Module({
  imports: [ProtocolModule],
  controllers: [HealthController],
})
export class AppModule {}
