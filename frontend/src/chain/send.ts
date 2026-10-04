import { type Connection } from '@solana/web3.js';
import type { ConnectedWallet } from './wallet';
import type { AdminAction } from '../features/admin/schemas';
import { buildAdminTransaction } from './build';
import { sendWalletTransaction } from './transaction';
export async function sendAdminTransaction(
  connection: Connection,
  connected: ConnectedWallet,
  input: AdminAction,
  submitted: (signature: string) => void,
  signal?: AbortSignal,
) {
  const transaction = await buildAdminTransaction(
    connection,
    connected.address,
    input,
  );
  return sendWalletTransaction(
    connection,
    connected,
    transaction,
    submitted,
    signal,
  );
}
export { sendWalletTransaction } from './transaction';
