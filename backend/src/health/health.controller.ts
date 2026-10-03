import { Controller, Get } from '@nestjs/common';
import type { ApiHealth } from '@treetino/contracts';

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): ApiHealth {
    return { status: 'ok', service: 'treetino-backend' };
  }
}
