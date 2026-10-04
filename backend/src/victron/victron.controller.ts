import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { VictronService } from './victron.service';
import { VictronDemosResponseDto } from './victron.dto';

@ApiTags('Victron Energy')
@Controller('victron')
export class VictronController {
  constructor(private readonly victronService: VictronService) {}

  @Get('demos')
  @ApiOperation({
    summary: 'Get live Victron Energy demo installations and telemetry',
    description:
      'Fetches real-time telemetry from Victron VRM public demo systems: Off-grid, ESS System (Battery storage), and Multiple EV Chargers.',
  })
  @ApiOkResponse({
    description:
      'Live Victron demo installations with telemetry and investment metrics',
    type: VictronDemosResponseDto,
  })
  async getDemos(): Promise<VictronDemosResponseDto> {
    return this.victronService.getDemos();
  }
}
