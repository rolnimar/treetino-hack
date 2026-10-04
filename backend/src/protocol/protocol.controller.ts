import { Controller, Get } from '@nestjs/common';
import type { ProtocolInfo } from '@treetino/contracts';
import { ProtocolService } from './protocol.service';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ProtocolDto } from '../api/api.dto';

@Controller('protocol')
@ApiTags('Protocol')
export class ProtocolController {
  constructor(private readonly protocolService: ProtocolService) {}

  @Get()
  @ApiOperation({ summary: 'Get protocol network and program address' })
  @ApiOkResponse({ type: ProtocolDto })
  getInfo(): ProtocolInfo {
    return this.protocolService.getInfo();
  }
}
