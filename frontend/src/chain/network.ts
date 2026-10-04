import type { Connection } from '@solana/web3.js';
export const DEVNET_GENESIS = 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';
export async function assertDevnet(connection: Connection) {
  if ((await connection.getGenesisHash()) !== DEVNET_GENESIS)
    throw new Error('Select a devnet RPC to use this deployment');
}
