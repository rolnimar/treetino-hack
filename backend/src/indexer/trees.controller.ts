import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import type { TreePhase, TreesResponse } from '@treetino/contracts';
import { IndexerService } from './indexer.service';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { TreesDto } from '../api/api.dto';

@Controller('trees')
@ApiTags('Trees')
export class TreesController {
  constructor(private readonly indexer: IndexerService) {}

  @Get()
  @ApiOperation({
    summary: 'List initialized trees',
    description:
      'Public endpoint backed by PostgreSQL. Filter phase=funding to find trees accepting shares. State reflects the latest indexed confirmed event.',
  })
  @ApiQuery({
    name: 'phase',
    required: false,
    enum: ['funding', 'funded', 'purchased', 'active'],
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    schema: { type: 'integer', minimum: 1, maximum: 1000, default: 100 },
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    schema: { type: 'integer', minimum: 0, default: 0 },
  })
  @ApiOkResponse({ type: TreesDto })
  @ApiBadRequestResponse({
    description: 'Invalid phase or pagination parameters.',
  })
  listTrees(
    @Query('phase') phase?: string,
    @Query('limit') limit = '100',
    @Query('offset') offset = '0',
  ): Promise<TreesResponse> {
    if (
      phase !== undefined &&
      !['funding', 'funded', 'purchased', 'active'].includes(phase)
    ) {
      throw new BadRequestException(
        'phase must be funding, funded, purchased, or active',
      );
    }
    const pageSize = Number(limit);
    const pageOffset = Number(offset);
    if (
      !Number.isSafeInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 1000 ||
      !Number.isSafeInteger(pageOffset) ||
      pageOffset < 0
    ) {
      throw new BadRequestException(
        'limit must be 1–1000; offset must be a nonnegative integer',
      );
    }
    return this.indexer.listTrees(
      phase as TreePhase | undefined,
      pageSize,
      pageOffset,
    );
  }
}
