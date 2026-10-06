import { PublicKey, Transaction, type Connection } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, unpackAccount, unpackMint } from '@solana/spl-token';
import { assertDevnet } from './network';
import {
  paymentMintAddress,
  paymentAtaAddress,
  treeAddress,
  shareMintAddress,
  fundingVaultAddress,
} from './addresses';
import {
  buySharesInstruction,
  giveMeMoneyInstruction,
  claimRewardsInstruction,
} from './instructions';
import {
  publicActionSchema,
  type PublicAction,
} from '../features/marketplace/schemas';

/** Reads only the payment mint and the connected wallet's token account. */
export async function readMockUsdcBalance(
  connection: Connection,
  address: string,
) {
  await assertDevnet(connection);
  const owner = new PublicKey(address);
  const mintAddress = paymentMintAddress();
  const ata = paymentAtaAddress(owner);
  const [mintAccount, tokenAccount] = await connection.getMultipleAccountsInfo([
    mintAddress,
    ata,
  ]);
  if (!mintAccount) return { initialized: false, balance: '0' };
  const mint = unpackMint(mintAddress, mintAccount, TOKEN_PROGRAM_ID);
  if (
    !mint.isInitialized ||
    mint.decimals !== 6 ||
    !mint.mintAuthority?.equals(mintAddress) ||
    mint.freezeAuthority
  )
    throw new Error('The payment mint is not the expected mockUSDC');
  if (!tokenAccount) return { initialized: true, balance: '0' };
  const token = unpackAccount(ata, tokenAccount, TOKEN_PROGRAM_ID);
  if (
    !token.owner.equals(owner) ||
    !token.mint.equals(mintAddress) ||
    !token.isInitialized ||
    token.isFrozen
  )
    throw new Error('Invalid mockUSDC wallet account');
  return { initialized: true, balance: token.amount.toString() };
}

export async function buildPublicTransaction(
  connection: Connection,
  address: string,
  value: PublicAction,
) {
  const input = publicActionSchema.parse(value);
  const owner = new PublicKey(address);
  const state = await readMockUsdcBalance(connection, address);
  if (!state.initialized)
    throw new Error('The demo payment token has not been initialized yet');
  const transaction = new Transaction();
  transaction.feePayer = owner;
  if (input.action === 'giveMeMoney') {
    transaction.add(giveMeMoneyInstruction(owner, input.amount));
    return transaction;
  }
  if (input.action === 'claimRewards') {
    transaction.add(
      claimRewardsInstruction(owner, new PublicKey(input.treeAddress)),
    );
    return transaction;
  }
  const tree = input.tree;
  if (tree.phase !== 'funding' || !tree.canBuy)
    throw new Error('This tree is no longer accepting funding');
  const key = new PublicKey(tree.address);
  if (
    !treeAddress(new PublicKey(tree.creator), tree.treeId).equals(key) ||
    !shareMintAddress(key).equals(new PublicKey(tree.shareMint)) ||
    !fundingVaultAddress(key).equals(new PublicKey(tree.fundingTokenAccount)) ||
    tree.paymentMint !== paymentMintAddress().toBase58()
  )
    throw new Error('Backend tree addresses do not match the program seeds');
  const target = BigInt(tree.target);
  const raised = BigInt(tree.raised);
  if (
    target === 0n ||
    raised > target ||
    BigInt(tree.remaining) !== target - raised
  )
    throw new Error('Invalid tree funding data');
  if (BigInt(input.amount) > target - raised)
    throw new Error('Amount exceeds remaining tree funding');
  if (BigInt(input.amount) > BigInt(state.balance))
    throw new Error('Insufficient mockUSDC balance');
  transaction.add(buySharesInstruction(owner, tree, input.amount));
  return transaction;
}
