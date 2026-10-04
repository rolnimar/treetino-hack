import { ApiProperty } from '@nestjs/swagger';
import type {
  ApiHealth,
  ProtocolInfo,
  TreeInfo,
  TreePhase,
  TreesResponse,
} from '@treetino/contracts';

export class HealthDto implements ApiHealth {
  @ApiProperty({ enum: ['ok'] }) status!: 'ok';
  @ApiProperty({ enum: ['treetino-backend'] }) service!: 'treetino-backend';
}

export class ProtocolDto implements ProtocolInfo {
  @ApiProperty({ enum: ['treetino'] }) name!: 'treetino';
  @ApiProperty({ enum: ['devnet'] }) network!: 'devnet';
  @ApiProperty() programId!: string;
}

export class TreeDto implements TreeInfo {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ description: 'Tree account address (base58).' })
  address!: string;
  @ApiProperty({
    description: 'Creator-scoped u64 tree ID as a decimal string.',
  })
  treeId!: string;
  @ApiProperty() creator!: string;
  @ApiProperty() supplier!: string;
  @ApiProperty() client!: string;
  @ApiProperty() reporter!: string;
  @ApiProperty() paymentMint!: string;
  @ApiProperty() shareMint!: string;
  @ApiProperty() fundingTokenAccount!: string;
  @ApiProperty({
    description: 'Funding target in base units (6 decimals).',
    example: '100000000',
  })
  target!: string;
  @ApiProperty({
    description: 'Raised funding in base units (6 decimals).',
    example: '25000000',
  })
  raised!: string;
  @ApiProperty({
    description: 'Remaining funding in base units (6 decimals).',
    example: '75000000',
  })
  remaining!: string;
  @ApiProperty({
    type: String,
    enum: ['funding', 'funded', 'purchased', 'active'],
  })
  phase!: TreePhase;
  @ApiProperty({
    description:
      'True while funding with a positive remaining amount; reflects the latest indexed confirmed event.',
  })
  canBuy!: boolean;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
  @ApiProperty({
    description: 'Latest indexed tree-change transaction signature.',
  })
  signature!: string;
}

export class TreesDto implements TreesResponse {
  @ApiProperty({ type: [TreeDto] }) trees!: TreeDto[];
  @ApiProperty({
    type: 'integer',
    description: 'Total matching trees before pagination.',
  })
  total!: number;
}

export class EventDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({
    type: 'integer',
    description: 'Ordered pagination cursor, separate from UUID.',
  })
  sequence!: number;
  @ApiProperty() signature!: string;
  @ApiProperty({ type: 'integer' }) slot!: number;
  @ApiProperty({ type: 'integer', description: 'Unix timestamp in seconds.' })
  blockTime!: number;
  @ApiProperty({ type: 'integer' }) eventIndex!: number;
  @ApiProperty({
    description: 'Event name from the JSON IDL, e.g. TreeChanged.',
  })
  name!: string;
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description:
      'Decoded event payload. u64/i64 amounts are decimal strings and public keys are base58.',
  })
  data!: unknown;
}

export class EventsDto {
  @ApiProperty({ type: [EventDto] }) events!: EventDto[];
  @ApiProperty({
    type: 'integer',
    description: 'Pass this as after on the next request.',
  })
  nextCursor!: number;
}

export class IndexerStatusDto {
  @ApiProperty() enabled!: boolean;
  @ApiProperty() programId!: string;
  @ApiProperty({ type: String, nullable: true }) stream!: string | null;
  @ApiProperty({ format: 'date-time' }) startAt!: string;
  @ApiProperty({ type: 'integer' }) pollSeconds!: number;
  @ApiProperty({ type: String, nullable: true }) cursor!: string | null;
  @ApiProperty({
    description:
      'True only while a poll is in progress; false between scheduled polls.',
  })
  running!: boolean;
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  lastSuccessfulPoll!: string | null;
  @ApiProperty({ type: String, nullable: true }) lastError!: string | null;
  @ApiProperty({ type: 'integer' }) transactions!: number;
  @ApiProperty({ type: 'integer' }) events!: number;
}
