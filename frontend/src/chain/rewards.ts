import type { BN } from '@anchor-lang/core';
import { PublicKey, type Connection } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, unpackAccount } from '@solana/spl-token';
import { z } from 'zod';
import {
  paymentMintAddress,
  positionAddress,
  revenueVaultAddress,
  shareMintAddress,
  treeAddress,
  u64Seed,
} from './addresses';
import { decodeProgramAccount } from './read';
import { assertDevnet } from './network';
import { treeSchema, u64Schema, type IndexedTree } from '../lib/schemas';

const SCALE = 1_000_000_000_000_000_000n;
const MAX_U128 = (1n << 128n) - 1n;
const rewardsSchema = z.object({
  active: z.boolean(),
  hasPosition: z.boolean(),
  shares: u64Schema,
  claimable: u64Schema,
  vaultBalance: u64Schema,
  canClaim: z.boolean(),
});

/** Reads one backend-listed tree and this wallet's position, never a chain catalog. */
export async function readTreeRewards(
  connection: Connection,
  wallet: string,
  value: IndexedTree,
) {
  const info = treeSchema.parse(value);
  const address = new PublicKey(info.address);
  const owner = new PublicKey(wallet);
  if (
    !treeAddress(new PublicKey(info.creator), info.treeId).equals(address) ||
    info.paymentMint !== paymentMintAddress().toBase58() ||
    info.shareMint !== shareMintAddress(address).toBase58()
  )
    throw new Error('Backend tree addresses do not match the program seeds');
  await assertDevnet(connection);
  const vaultAddress = revenueVaultAddress(address);
  // One confirmed snapshot keeps the reward index, position and vault consistent.
  const [treeAccount, positionAccount, vaultAccount] =
    await connection.getMultipleAccountsInfo(
      [address, positionAddress(address, owner), vaultAddress],
      'confirmed',
    );
  const tree = decodeProgramAccount<{
    creator: PublicKey;
    seed_id: number[];
    payment_mint: PublicKey;
    share_mint: PublicKey;
    phase: Record<string, unknown>;
    target: BN;
    reward_index: BN;
    paid: BN;
    claimed: BN;
  }>('Tree', treeAccount);
  if (
    !tree.creator.equals(new PublicKey(info.creator)) ||
    tree.seed_id.length !== 8 ||
    !tree.seed_id.every((n, i) => n === u64Seed(info.treeId)[i]) ||
    !tree.payment_mint.equals(paymentMintAddress()) ||
    !tree.share_mint.equals(shareMintAddress(address))
  )
    throw new Error('On-chain tree does not match the selected tree');
  if (!vaultAccount) throw new Error('Tree revenue account does not exist');
  const vault = unpackAccount(vaultAddress, vaultAccount, TOKEN_PROGRAM_ID);
  if (
    !vault.owner.equals(address) ||
    !vault.mint.equals(paymentMintAddress()) ||
    !vault.isInitialized ||
    vault.isFrozen
  )
    throw new Error('Invalid tree revenue account');

  const index = BigInt(tree.reward_index.toString());
  const unclaimed =
    BigInt(tree.paid.toString()) - BigInt(tree.claimed.toString());
  if (unclaimed < 0n || BigInt(tree.target.toString()) === 0n)
    throw new Error('Invalid tree reward accounting');
  let shares = 0n;
  let amount = 0n;
  if (positionAccount) {
    const position = decodeProgramAccount<{
      tree: PublicKey;
      owner: PublicKey;
      shares: BN;
      index: BN;
      pending_scaled: BN;
    }>('Position', positionAccount);
    if (!position.tree.equals(address) || !position.owner.equals(owner))
      throw new Error('Invalid investor position');
    shares = BigInt(position.shares.toString());
    const previousIndex = BigInt(position.index.toString());
    const pending = BigInt(position.pending_scaled.toString());
    const scaled = pending + shares * (index - previousIndex);
    if (previousIndex > index || scaled < 0n || scaled > MAX_U128)
      throw new Error('Invalid investor reward accounting');
    // Matches prepare_position and claim_rewards, including fractional dust.
    amount = scaled / SCALE;
    if (amount > unclaimed)
      throw new Error('Rewards exceed unpaid distributions');
  }
  const active = Object.hasOwn(tree.phase, 'Active');
  return rewardsSchema.parse({
    active,
    hasPosition: !!positionAccount,
    shares: shares.toString(),
    claimable: amount.toString(),
    vaultBalance: vault.amount.toString(),
    canClaim: active && amount > 0n && vault.amount >= amount,
  });
}
