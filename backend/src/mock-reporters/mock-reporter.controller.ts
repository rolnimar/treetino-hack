import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminGuard } from '../auth/auth.controller';
import {
  MockReporterDto,
  MockReporterStatusDto,
  MockReportResultDto,
  ReportSimulationDto,
} from '../api/api.dto';
import { MockReporterService } from './mock-reporter.service';

class PrepareReporterDto {
  @ApiProperty({ description: 'Creator-scoped u64 tree ID as a string' })
  treeId!: string;
}
class SimulateReportDto {
  @ApiProperty({
    format: 'date',
    description: 'Completed UTC day to report, in YYYY-MM-DD format',
  })
  day!: string;
}
@Controller('admin')
@ApiTags('Mock reporters')
@ApiBearerAuth()
@UseGuards(AdminGuard)
export class MockReporterController {
  constructor(private readonly reporters: MockReporterService) {}
  @Post('mock-reporters')
  @ApiOperation({
    summary: 'Prepare a stable mock reporter wallet before tree initialization',
    description:
      'Generates and stores a devnet key for the authenticated creator and tree ID. Returns the public key only. Repeated requests reuse the saved wallet.',
  })
  @ApiCreatedResponse({ type: MockReporterDto })
  prepare(
    @Req() request: { admin: { wallet: string } },
    @Body() body: PrepareReporterDto,
  ) {
    return this.reporters.prepare(request.admin.wallet, body?.treeId);
  }
  @Post('trees/:address/simulate-report')
  @ApiOperation({
    summary:
      'Submit a selected completed UTC day using the saved mock reporter',
  })
  @ApiCreatedResponse({ type: MockReportResultDto })
  simulate(
    @Param('address') address: string,
    @Req() request: { admin: { wallet: string } },
    @Body() body: SimulateReportDto,
  ) {
    return this.reporters.simulate(address, request.admin.wallet, body?.day);
  }
  @Get('trees/:address/report-simulation')
  @ApiOperation({
    summary:
      'Get simulated readings for a selected UTC day for frontend wallet signing',
    description:
      'Returns data only. The frontend constructs the transaction and the configured reporter wallet signs it.',
  })
  @ApiOkResponse({ type: ReportSimulationDto })
  @ApiQuery({
    name: 'day',
    required: true,
    schema: { type: 'string', format: 'date' },
  })
  simulation(
    @Param('address') address: string,
    @Req() request: { admin: { wallet: string } },
    @Query('day') day: string,
  ) {
    return this.reporters.simulation(address, request.admin.wallet, day);
  }
  @Get('trees/:address/mock-reporter')
  @ApiOperation({
    summary: 'Get mock reporter status',
    description:
      'Public key, cached SOL balance, last signature and submission error. Private keys are never returned.',
  })
  @ApiOkResponse({ type: MockReporterStatusDto })
  async status(@Param('address') address: string) {
    return { reporter: await this.reporters.status(address) };
  }
}
