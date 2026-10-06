import { Injectable } from '@nestjs/common';
import { Connection, PublicKey } from '@solana/web3.js';
import { TREETINO_PROGRAM_ID } from '@treetino/contracts';
import { IndexerConfig } from './indexer.config';

@Injectable()
export class SolanaRpcService {
  readonly connection: Connection;
  private readonly programId = new PublicKey(TREETINO_PROGRAM_ID);

  constructor(config: IndexerConfig) {
    this.connection = new Connection(config.rpcUrl, {
      commitment: 'confirmed',
      disableRetryOnRateLimit: true,
      fetch: Object.assign(
        (...args: Parameters<typeof fetch>) =>
          fetch(args[0], {
            ...args[1],
            signal: AbortSignal.timeout(15_000),
          }),
        { preconnect: fetch.preconnect },
      ),
    });
  }

  getGenesisHash() {
    return this.connection.getGenesisHash();
  }

  getTreeAccount(address: string, minContextSlot: number) {
    return this.connection.getAccountInfo(new PublicKey(address), {
      commitment: 'confirmed',
      minContextSlot,
    });
  }

  getReportAccount(address: string, minContextSlot: number) {
    return this.getTreeAccount(address, minContextSlot);
  }

  getSignatures(before?: string) {
    return this.connection.getSignaturesForAddress(
      this.programId,
      { before, limit: 1000 },
      'confirmed',
    );
  }

  getBlockTime(slot: number) {
    return this.connection.getBlockTime(slot);
  }

  getTransaction(signature: string) {
    return this.connection.getTransaction(signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });
  }
}
