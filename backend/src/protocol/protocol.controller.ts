import { Controller, Get } from '@nestjs/common';
import type { ProtocolInfo } from '@treetino/contracts';
import { ProtocolService } from './protocol.service';

@Controller('protocol')
export class ProtocolController {
  constructor(private readonly protocolService: ProtocolService) {}

  @Get()
  getInfo(): ProtocolInfo {
    return this.protocolService.getInfo();
  }
}
