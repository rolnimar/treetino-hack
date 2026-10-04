import { Injectable } from '@nestjs/common';

@Injectable()
export class IndexerConfig {
  readonly enabled: boolean;
  readonly rpcUrl: string;
  readonly pollIntervalMs: number;
  readonly startTime: number;

  constructor() {
    const enabled = process.env.INDEXER_ENABLED ?? 'true';
    if (!['true', 'false'].includes(enabled)) {
      throw new Error('INDEXER_ENABLED must be true or false');
    }
    this.enabled = enabled === 'true';
    this.rpcUrl = process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com';
    if (!['http:', 'https:'].includes(new URL(this.rpcUrl).protocol)) {
      throw new Error('SOLANA_RPC_URL must be an HTTP(S) URL');
    }
    const seconds = Number(process.env.INDEXER_POLL_SECONDS ?? 10);
    if (!Number.isSafeInteger(seconds) || seconds < 1 || seconds > 86400) {
      throw new Error(
        'INDEXER_POLL_SECONDS must be an integer from 1 to 86400',
      );
    }
    this.pollIntervalMs = seconds * 1000;
    // Fixed launch date: restarting tomorrow must still catch up from today.
    const start = process.env.INDEXER_START_AT ?? '2026-10-04T00:00:00Z';
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(start)) {
      throw new Error(
        'INDEXER_START_AT must be an ISO UTC timestamp ending in Z',
      );
    }
    this.startTime = Date.parse(start) / 1000;
    if (
      !Number.isSafeInteger(this.startTime) ||
      this.startTime < 0 ||
      new Date(this.startTime * 1000).toISOString().replace('.000Z', 'Z') !==
        start
    ) {
      throw new Error('INDEXER_START_AT is not a valid timestamp');
    }
  }
}
