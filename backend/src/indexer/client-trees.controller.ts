import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { PublicKey } from '@solana/web3.js';
import { ClientGuard, type ClientRequest } from '../auth/auth.controller';
import { TreesDto, TreeReportsDto } from '../api/api.dto';
import { IndexerService } from './indexer.service';

function pagination(limit: string, offset: string) {
  const size = Number(limit),
    start = Number(offset);
  if (
    !Number.isSafeInteger(size) ||
    size < 1 ||
    size > 100 ||
    !Number.isSafeInteger(start) ||
    start < 0
  )
    throw new BadRequestException(
      'limit must be 1–100; offset must be a nonnegative integer',
    );
  return [size, start] as const;
}
@Controller('client/trees')
@ApiTags('Client')
@ApiBearerAuth()
@UseGuards(ClientGuard)
export class ClientTreesController {
  constructor(private readonly indexer: IndexerService) {}
  @Get()
  @ApiOperation({
    summary: 'List trees assigned to the signed-in client wallet',
  })
  @ApiOkResponse({ type: TreesDto })
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
  trees(
    @Req() request: ClientRequest,
    @Query('limit') limit = '20',
    @Query('offset') offset = '0',
  ) {
    return this.indexer.listClientTrees(
      request.client.wallet,
      ...pagination(limit, offset),
    );
  }
  @Get(':address/reports')
  @ApiOperation({
    summary: 'Get invoices and production for a tree assigned to this client',
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
    @Req() request: ClientRequest,
    @Param('address') address: string,
    @Query('limit') limit = '20',
    @Query('offset') offset = '0',
  ) {
    try {
      if (new PublicKey(address).toBase58() !== address) throw new Error();
    } catch {
      throw new BadRequestException('Invalid tree address');
    }
    return this.indexer.listClientReports(
      request.client.wallet,
      address,
      ...pagination(limit, offset),
    );
  }
}
