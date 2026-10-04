import { Module } from '@nestjs/common';
import { VictronController } from './victron.controller';
import { VictronService } from './victron.service';

@Module({
  controllers: [VictronController],
  providers: [VictronService],
  exports: [VictronService],
})
export class VictronModule {}
