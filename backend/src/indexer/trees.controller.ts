import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Param,
} from '@nestjs/common';
import { PublicKey } from '@solana/web3.js';
import type { TreePhase, TreesResponse } from '@treetino/contracts';
import { IndexerService } from './indexer.service';
import {
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { TreesDto, TreeReportsDto } from '../api/api.dto';

@Controller('trees')
@ApiTags('Trees')
export class TreesController {
  constructor(private readonly indexer: IndexerService) {}

  @Get(':address/reports')
  @ApiOperation({
    summary: 'Get indexed reports and invoices for a tree',
    description:
      'Public PostgreSQL-backed history, including raw readings, spot-price invoice drafts, issued amounts and payments. No direct frontend chain reads.',
  })
  @ApiOkResponse({ type: TreeReportsDto })
  @ApiQuery({
    name: 'limit',
    required: false,
    schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    schema: { type: 'integer', minimum: 0, default: 0 },
  })
  reports(
    @Param('address') address: string,
    @Query('limit') limit = '20',
    @Query('offset') offset = '0',
  ) {
    try {
      if (new PublicKey(address).toBase58() !== address) throw new Error();
    } catch {
      throw new BadRequestException('Invalid tree address');
    }
    const pageSize = Number(limit),
      start = Number(offset);
    if (
      !Number.isSafeInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100 ||
      !Number.isSafeInteger(start) ||
      start < 0
    )
      throw new BadRequestException('Invalid report pagination');
    return this.indexer.listReports(address, pageSize, start);
  }

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
