import { Connection } from '@solana/web3.js';
import type { AdminAction } from '../features/admin/schemas';
import type { ConnectedWallet } from './wallet';
import { readProtocolState, readReports } from './read';
import { buildAdminTransaction } from './build';
import { sendAdminTransaction } from './send';
export { DEVNET_GENESIS } from './read';
export class AdminChainClient {
  readonly connection: Connection;
  constructor(connection?: Connection) {
    this.connection =
      connection ??
      new Connection(
        import.meta.env?.VITE_SOLANA_RPC_URL ?? 'https://api.devnet.solana.com',
        {
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
        },
      );
  }
  state(wallet: string) {
    return readProtocolState(this.connection, wallet);
  }
  reports(treeAddress: string) {
    return readReports(this.connection, treeAddress);
  }
  build(wallet: string, action: AdminAction) {
    return buildAdminTransaction(this.connection, wallet, action);
  }
  execute(
    connected: ConnectedWallet,
    action: AdminAction,
    submitted: (signature: string) => void,
    signal?: AbortSignal,
  ) {
    return sendAdminTransaction(
      this.connection,
      connected,
      action,
      submitted,
      signal,
    );
  }
}
