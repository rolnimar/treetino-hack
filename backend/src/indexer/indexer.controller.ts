import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { IndexerService } from './indexer.service';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { EventsDto, IndexerStatusDto } from '../api/api.dto';

@Controller('events')
@ApiTags('Events')
export class IndexerController {
  constructor(private readonly indexer: IndexerService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get indexer status and latest poll outcome' })
  @ApiOkResponse({ type: IndexerStatusDto })
  getStatus() {
    return this.indexer.getStatus();
  }

  @Get()
  @ApiOperation({ summary: 'Read indexed event history' })
  @ApiQuery({
    name: 'after',
    required: false,
    schema: { type: 'integer', minimum: 0, default: 0 },
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    schema: { type: 'integer', minimum: 1, maximum: 1000, default: 100 },
  })
  @ApiOkResponse({ type: EventsDto })
  @ApiBadRequestResponse({ description: 'Invalid cursor or page size.' })
  listEvents(@Query('after') after = '0', @Query('limit') limit = '100') {
    const cursor = Number(after);
    const pageSize = Number(limit);
    if (
      !Number.isSafeInteger(cursor) ||
      cursor < 0 ||
      !Number.isSafeInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 1000
    ) {
      throw new BadRequestException(
        'after must be a nonnegative integer; limit must be 1–1000',
      );
    }
    return this.indexer.listEvents(cursor, pageSize);
  }
}
