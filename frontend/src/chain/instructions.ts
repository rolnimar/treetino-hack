import { BN, BorshCoder, type Idl } from '@anchor-lang/core';
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
} from '@solana/spl-token';
import { TREETINO_IDL, type TreeInfo } from '@treetino/contracts';
import {
  PROGRAM_ID,
  METADATA_PROGRAM_ID,
  adminConfigAddress,
  paymentMintAddress,
  paymentMetadataAddress,
  treeAddress,
  shareMintAddress,
  fundingVaultAddress,
  revenueVaultAddress,
  paymentAtaAddress,
  positionAddress,
  shareAtaAddress,
} from './addresses';

// The JSON IDL retains Rust names. The coder and account metas use that same IDL.
const idl = TREETINO_IDL as unknown as Idl;
const coder = new BorshCoder(idl);
function instruction(
  name: string,
  args: Record<string, unknown>,
  accounts: Record<string, PublicKey>,
) {
  const definition = idl.instructions.find((entry) => entry.name === name);
  if (!definition) throw new Error(`Instruction not in IDL: ${name}`);
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    data: coder.instruction.encode(name, args),
    keys: definition.accounts.map((account) => {
      if ('accounts' in account) throw new Error('Unexpected account group');
      const pubkey =
        accounts[account.name] ??
        (account.address ? new PublicKey(account.address) : undefined);
      if (!pubkey) throw new Error(`Missing account: ${account.name}`);
      return {
        pubkey,
        isSigner: account.signer ?? false,
        isWritable: account.writable ?? false,
      };
    }),
  });
}
export const initAdminsInstruction = (
  authority: PublicKey,
  programData: PublicKey,
  admins: PublicKey[],
) =>
  instruction(
    'init_admins',
    { admins },
    {
      authority,
      program: PROGRAM_ID,
      program_data: programData,
      admin_config: adminConfigAddress(),
      system_program: SystemProgram.programId,
    },
  );
export const setAdminsInstruction = (
  authority: PublicKey,
  programData: PublicKey,
  admins: PublicKey[],
) =>
  instruction(
    'set_admins',
    { admins },
    {
      authority,
      program: PROGRAM_ID,
      program_data: programData,
      admin_config: adminConfigAddress(),
    },
  );
export const initPaymentTokenInstruction = (payer: PublicKey) =>
  instruction(
    'init_payment_token',
    {},
    {
      payer,
      payment_mint: paymentMintAddress(),
      payment_metadata: paymentMetadataAddress(),
      metadata_program: METADATA_PROGRAM_ID,
      token_program: TOKEN_PROGRAM_ID,
      system_program: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    },
  );
export interface InitTreeInput {
  treeId: string;
  target: string;
  supplier: PublicKey;
  client: PublicKey;
  reporter: PublicKey;
}
export function initTreeInstruction(creator: PublicKey, input: InitTreeInput) {
  const tree = treeAddress(creator, input.treeId);
  return instruction(
    'init_tree',
    {
      tree_id: new BN(input.treeId),
      target: new BN(input.target),
      supplier: input.supplier,
      client: input.client,
      reporter: input.reporter,
    },
    {
      creator,
      admin_config: adminConfigAddress(),
      tree,
      payment_mint: paymentMintAddress(),
      share_mint: shareMintAddress(tree),
      funding_token_account: fundingVaultAddress(tree),
      revenue_token_account: revenueVaultAddress(tree),
      token_program: TOKEN_PROGRAM_ID,
      system_program: SystemProgram.programId,
    },
  );
}
export function purchaseTreeInstructions(creator: PublicKey, tree: TreeInfo) {
  const address = new PublicKey(tree.address);
  const supplier = new PublicKey(tree.supplier);
  const supplierAccount = paymentAtaAddress(supplier);
  return [
    createAssociatedTokenAccountIdempotentInstruction(
      creator,
      supplierAccount,
      supplier,
      paymentMintAddress(),
    ),
    instruction(
      'purchase_tree',
      {},
      {
        creator,
        tree: address,
        funding_token_account: fundingVaultAddress(address),
        supplier_payment_token_account: supplierAccount,
        token_program: TOKEN_PROGRAM_ID,
      },
    ),
  ];
}
export const activateTreeInstruction = (
  creator: PublicKey,
  tree: TreeInfo,
  timestamp: bigint,
) =>
  instruction(
    'activate_tree',
    { first_day_start_ts: new BN(timestamp.toString()) },
    {
      creator,
      tree: new PublicKey(tree.address),
      share_mint: new PublicKey(tree.shareMint),
      token_program: TOKEN_PROGRAM_ID,
    },
  );
export const issueInvoiceInstruction = (
  creator: PublicKey,
  tree: PublicKey,
  report: PublicKey,
  amount: string,
) =>
  instruction(
    'issue_invoice',
    { amount: new BN(amount) },
    { creator, tree, report },
  );
export const giveMeMoneyInstruction = (owner: PublicKey, amount: string) =>
  instruction(
    'give_me_money',
    { amount: new BN(amount) },
    {
      owner,
      payment_mint: paymentMintAddress(),
      payment_token_account: paymentAtaAddress(owner),
      associated_token_program: ASSOCIATED_TOKEN_PROGRAM_ID,
      token_program: TOKEN_PROGRAM_ID,
      system_program: SystemProgram.programId,
    },
  );

export function buySharesInstruction(
  owner: PublicKey,
  tree: TreeInfo,
  amount: string,
) {
  const address = new PublicKey(tree.address);
  return instruction(
    'buy_shares',
    { amount: new BN(amount) },
    {
      owner,
      tree: address,
      share_mint: shareMintAddress(address),
      funding_token_account: fundingVaultAddress(address),
      payment_token_account: paymentAtaAddress(owner),
      share_token_account: shareAtaAddress(address, owner),
      position: positionAddress(address, owner),
      associated_token_program: ASSOCIATED_TOKEN_PROGRAM_ID,
      token_program: TOKEN_PROGRAM_ID,
      system_program: SystemProgram.programId,
    },
  );
}

export function claimRewardsInstruction(
  owner: PublicKey,
  treeAddressPubkey: PublicKey,
) {
  return instruction(
    'claim_rewards',
    {},
    {
      owner,
      tree: treeAddressPubkey,
      position: positionAddress(treeAddressPubkey, owner),
      revenue_token_account: revenueVaultAddress(treeAddressPubkey),
      payment_token_account: paymentAtaAddress(owner),
      token_program: TOKEN_PROGRAM_ID,
    },
  );
}
