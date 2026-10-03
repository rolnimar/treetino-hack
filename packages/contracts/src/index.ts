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
