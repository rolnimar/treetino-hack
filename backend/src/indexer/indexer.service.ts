import {
  Injectable,
  Logger,
  type OnModuleInit,
  type OnApplicationBootstrap,
  type BeforeApplicationShutdown,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { BN, BorshCoder, EventParser } from '@anchor-lang/core';
import { PublicKey, type ConfirmedSignatureInfo } from '@solana/web3.js';
import {
  TREETINO_IDL,
  TREETINO_PROGRAM_ID,
  type TreePhase,
} from '@treetino/contracts';
import { IndexerConfig } from './indexer.config';
import type { IndexerState } from '../database/schema';
import { IndexerRepository } from './indexer.repository';
import { SolanaRpcService } from './solana-rpc.service';
import { decodeTree } from './tree.decoder';

// Preserve u64/i64 precision and store public keys as base58 strings.
function normalize(value: unknown): unknown {
  if (BN.isBN(value)) return (value as BN).toString(10);
  if (value instanceof PublicKey) return value.toBase58();
  if (Array.isArray(value)) return value.map(normalize);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, normalize(v)]),
    );
  }
  return value;
}

@Injectable()
export class IndexerService
  implements OnModuleInit, OnApplicationBootstrap, BeforeApplicationShutdown
{
  private readonly logger = new Logger(IndexerService.name);
  private readonly parser = new EventParser(
    new PublicKey(TREETINO_PROGRAM_ID),
    new BorshCoder(TREETINO_IDL),
  );
  private state: IndexerState | null = null;
  private inFlight: Promise<void> | null = null;
  private stopping = false;
  private lastError: string | null = null;
  private lastSuccessfulPoll: string | null = null;

  constructor(
    private readonly config: IndexerConfig,
    private readonly repository: IndexerRepository,
    private readonly rpc: SolanaRpcService,
    private readonly scheduler: SchedulerRegistry,
  ) {}

  async onModuleInit() {
    this.state = await this.repository.getSavedState(
      this.config.rpcUrl,
      TREETINO_PROGRAM_ID,
    );
  }

  onApplicationBootstrap() {
    if (!this.config.enabled) return;
    this.scheduler.addInterval(
      'solana-events',
      setInterval(() => {
        void this.poll();
      }, this.config.pollIntervalMs),
    );
    void this.poll();
  }

  poll(): Promise<void> {
    if (this.stopping) return Promise.resolve();
    if (this.inFlight) return this.inFlight;
    this.inFlight = this.scan()
      .then(() => {
        this.lastError = null;
        this.lastSuccessfulPoll = new Date().toISOString();
      })
      .catch((error: unknown) => {
        this.lastError = error instanceof Error ? error.message : String(error);
        this.logger.error(this.lastError);
      })
      .finally(() => {
        this.inFlight = null;
      });
    return this.inFlight;
  }

  private async scan() {
    const genesisHash = await this.rpc.getGenesisHash();
    const stream = `${genesisHash}:${TREETINO_PROGRAM_ID}`;
    this.state = await this.repository.initialize(
      stream,
      this.config.startTime,
      this.config.rpcUrl,
      TREETINO_PROGRAM_ID,
    );
    const state = this.state;
    const pending: (ConfirmedSignatureInfo & { blockTime: number })[] = [];
    let before: string | undefined;
    let boundaryFound = false;

    // Include the saved cursor in pagination so a missing history boundary is detectable.
    while (!boundaryFound && !this.stopping) {
      const page = await this.rpc.getSignatures(before);
      if (page.length === 0) {
        if (state.cursor) {
          throw new Error(
            `RPC history gap: saved cursor ${state.cursor} was not found. Use an RPC with retained history.`,
          );
        }
        break;
      }
      for (const entry of page) {
        if (entry.signature === state.cursor) {
          boundaryFound = true;
          break;
        }
        const blockTime =
          entry.blockTime ?? (await this.rpc.getBlockTime(entry.slot));
        if (blockTime === null)
          throw new Error(`Block time unavailable at slot ${entry.slot}`);
        if (!state.cursor && blockTime < state.startTime) {
          boundaryFound = true;
          break;
        }
        if (blockTime >= state.startTime) pending.push({ ...entry, blockTime });
      }
      const nextBefore = page[page.length - 1].signature;
      if (!boundaryFound && before === nextBefore)
        throw new Error('RPC pagination did not advance');
      before = nextBefore;
    }

    // Save oldest first: a failed fetch leaves the cursor before the missing transaction.
    for (const entry of pending.reverse()) {
      if (this.stopping) return;
      let transaction: Awaited<ReturnType<SolanaRpcService['getTransaction']>> =
        null;
      let events: { name: string; data: unknown }[] = [];
      if (entry.err === null) {
        transaction = await this.rpc.getTransaction(entry.signature);
        if (!transaction?.meta)
          throw new Error(`Transaction unavailable: ${entry.signature}`);
        if (transaction.meta.err !== null)
          throw new Error(`Transaction status mismatch: ${entry.signature}`);
        const logs = transaction.meta.logMessages;
        if (
          !logs ||
          logs.length === 0 ||
          logs.some((log) => /log.*truncat/i.test(log))
        ) {
          throw new Error(`Missing or truncated logs: ${entry.signature}`);
        }
        // Anchor also writes ordinary text with `Program log:`. Strict decoding
        // applies only to emit! data; retain invocation lines for CPI attribution.
        events = [
          ...this.parser.parseLogs(
            logs.filter((log) => !log.startsWith('Program log:')),
            true,
          ),
        ].map((event) => ({
          name: event.name,
          data: normalize(event.data),
        }));
      }
      const trees = [];
      for (const event of events) {
        if (event.name !== 'TreeChanged') continue;
        const { tree: address } = event.data as { tree: string };
        const account = await this.rpc.getTreeAccount(address, entry.slot);
        trees.push(decodeTree(address, event.data, account));
      }
      await this.repository.saveTransaction(
        stream,
        entry.signature,
        entry.slot,
        entry.blockTime,
        entry.err,
        transaction,
        events,
        trees,
      );
      state.cursor = entry.signature;
    }
    if (pending.length)
      this.logger.log(`Indexed ${pending.length} transactions`);
  }

  async getStatus() {
    return {
      enabled: this.config.enabled,
      programId: TREETINO_PROGRAM_ID,
      stream: this.state?.stream ?? null,
      startAt: new Date(
        (this.state?.startTime ?? this.config.startTime) * 1000,
      ).toISOString(),
      pollSeconds: this.config.pollIntervalMs / 1000,
      cursor: this.state?.cursor ?? null,
      running: this.inFlight !== null,
      lastSuccessfulPoll: this.lastSuccessfulPoll,
      lastError: this.lastError,
      ...(this.state
        ? await this.repository.counts(this.state.stream)
        : { transactions: 0, events: 0 }),
    };
  }

  async listEvents(after: number, limit: number) {
    const events = this.state
      ? await this.repository.listEvents(this.state.stream, after, limit)
      : [];
    return { events, nextCursor: events.at(-1)?.sequence ?? after };
  }

  async listTrees(phase: TreePhase | undefined, limit: number, offset: number) {
    return this.state
      ? this.repository.listTrees(this.state.stream, phase, limit, offset)
      : { trees: [], total: 0 };
  }

  async beforeApplicationShutdown() {
    this.stopping = true;
    if (this.scheduler.doesExist('interval', 'solana-events')) {
      this.scheduler.deleteInterval('solana-events');
    }
    await this.inFlight;
  }
}
