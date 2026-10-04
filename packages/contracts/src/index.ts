import idl from './idl/treetino.json';
import type { Treetino } from './types/treetino';

export type { Treetino };
export {
  TreetinoErrorCode,
  type TreetinoErrorName,
} from './types/treetino_errors';
export const TREETINO_IDL: Treetino = idl as Treetino;
export const TREETINO_PROGRAM_ID = TREETINO_IDL.address;

export interface ApiHealth {
  status: 'ok';
  service: 'treetino-backend';
}

export interface ProtocolInfo {
  name: 'treetino';
  network: 'devnet';
  programId: string;
}

export type TreePhase = 'funding' | 'funded' | 'purchased' | 'active';

export interface TreeInfo {
  id: string;
  address: string;
  treeId: string;
  creator: string;
  supplier: string;
  client: string;
  reporter: string;
  paymentMint: string;
  shareMint: string;
  fundingTokenAccount: string;
  /** Amounts are decimal strings in base units (6 decimals), with 1:1 shares. */
  target: string;
  raised: string;
  remaining: string;
  phase: TreePhase;
  canBuy: boolean;
  maxIntervalWh: number;
  updatedAt: string;
  signature: string;
}

export interface TreesResponse {
  trees: TreeInfo[];
  total: number;
}
