import { BN, BorshCoder } from '@anchor-lang/core';
import { PublicKey, type AccountInfo } from '@solana/web3.js';
import {
  TREETINO_IDL,
  TREETINO_PROGRAM_ID,
  type TreePhase,
} from '@treetino/contracts';
import type { IndexedTreeInput } from '../database/schema';

interface TreeAccount {
  creator: PublicKey;
  seed_id: number[];
  supplier: PublicKey;
  client: PublicKey;
  reporter: PublicKey;
  payment_mint: PublicKey;
  share_mint: PublicKey;
  target: BN;
  max_interval_wh: number;
}

const coder = new BorshCoder(TREETINO_IDL);
const programId = new PublicKey(TREETINO_PROGRAM_ID);

export function decodeTree(
  address: string,
  event: unknown,
  account: AccountInfo<Buffer> | null,
): IndexedTreeInput {
  if (!account) throw new Error(`Tree account unavailable: ${address}`);
  if (!account.owner.equals(programId) || account.executable) {
    throw new Error(`Invalid tree account owner: ${address}`);
  }
  const tree = coder.accounts.decode<TreeAccount>('Tree', account.data);
  // The JSON IDL retains Rust field names, including PascalCase enum variants.
  const change = event as { phase: Record<string, unknown>; raised: string };
  const phase = Object.keys(change.phase)[0]?.toLowerCase() as TreePhase;
  if (!['funding', 'funded', 'purchased', 'active'].includes(phase)) {
    throw new Error(`Invalid tree phase: ${address}`);
  }
  const raised = BigInt(change.raised);
  if (raised < 0n || raised > BigInt(tree.target.toString())) {
    throw new Error(`Invalid tree funding amount: ${address}`);
  }
  const [expectedAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from('tree'), tree.creator.toBuffer(), Buffer.from(tree.seed_id)],
    programId,
  );
  if (expectedAddress.toBase58() !== address)
    throw new Error(`Invalid tree PDA: ${address}`);
  const [fundingTokenAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from('funding'), expectedAddress.toBuffer()],
    programId,
  );
  return {
    address,
    treeId: Buffer.from(tree.seed_id).readBigUInt64LE().toString(),
    creator: tree.creator.toBase58(),
    supplier: tree.supplier.toBase58(),
    client: tree.client.toBase58(),
    reporter: tree.reporter.toBase58(),
    paymentMint: tree.payment_mint.toBase58(),
    shareMint: tree.share_mint.toBase58(),
    fundingTokenAccount: fundingTokenAccount.toBase58(),
    target: tree.target.toString(),
    raised: raised.toString(),
    phase,
    maxIntervalWh: tree.max_interval_wh,
  };
}
