import { Controller, Get } from '@nestjs/common';
import type { ApiHealth } from '@treetino/contracts';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthDto } from '../api/api.dto';

@Controller('health')
@ApiTags('Health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Check backend health' })
  @ApiOkResponse({ type: HealthDto })
  getHealth(): ApiHealth {
    return { status: 'ok', service: 'treetino-backend' };
  }
}
