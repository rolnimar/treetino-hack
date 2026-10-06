import { BN, BorshCoder, type Idl } from '@anchor-lang/core';
import {
  Keypair,
  PublicKey,
  Connection,
  Transaction,
  type AccountInfo,
} from '@solana/web3.js';
import { MintLayout, TOKEN_PROGRAM_ID, AccountLayout } from '@solana/spl-token';
import type { TreeInfo } from '@treetino/contracts';
import { TREETINO_IDL } from '@treetino/contracts';
import bs58 from 'bs58';
import { AdminChainClient, DEVNET_GENESIS } from '../../src/chain/client';
import {
  PROGRAM_ID,
  UPGRADEABLE_LOADER_ID,
  adminConfigAddress,
  paymentMintAddress,
  treeAddress,
  shareMintAddress,
  fundingVaultAddress,
  revenueVaultAddress,
  reportAddress,
  paymentAtaAddress,
  paymentMetadataAddress,
  positionAddress,
} from '../../src/chain/addresses';
import {
  parseTokenAmount,
  formatTokenAmount,
  nextUtcDay,
} from '../../src/chain/amounts';
import type { ConnectedWallet } from '../../src/chain/wallet';

const coder = new BorshCoder(TREETINO_IDL as unknown as Idl);
const creator = Keypair.generate();
const other = Keypair.generate();
const supplier = Keypair.generate().publicKey;
const clientWallet = Keypair.generate().publicKey;
const reporter = Keypair.generate().publicKey;
const programData = PublicKey.findProgramAddressSync(
  [PROGRAM_ID.toBuffer()],
  UPGRADEABLE_LOADER_ID,
)[0];
const treeId = '18446744073709551615';
const tree = treeAddress(creator.publicKey, treeId);
const dayStartTs = '1791072000';
const report = reportAddress(tree, dayStartTs);
const blockhash = Keypair.generate().publicKey.toBase58();
const dispose: (() => void)[] = [];
export function cleanup() {
  for (const callback of dispose.splice(0)) callback();
}

function account(
  data: Buffer,
  owner = PROGRAM_ID,
  executable = false,
): AccountInfo<Buffer> {
  return { data, owner, executable, lamports: 1_000_000, rentEpoch: 0 };
}
function jsonAccount(value: AccountInfo<Buffer> | null) {
  return value
    ? {
        ...value,
        owner: value.owner.toBase58(),
        data: [value.data.toString('base64'), 'base64'],
      }
    : null;
}
async function fixture({
  initialized = true,
  phase = 'Purchased',
  invoice = false,
  genesis = DEVNET_GENESIS,
  failed = false,
  onSend = undefined as
    | ((
        tx: Transaction,
        accounts: Map<string, AccountInfo<Buffer>>,
      ) => Promise<void> | void)
    | undefined,
} = {}) {
  const accounts = new Map<string, AccountInfo<Buffer>>();
  const program = Buffer.alloc(36);
  program.writeUInt32LE(2);
  programData.toBuffer().copy(program, 4);
  const data = Buffer.alloc(45);
  data.writeUInt32LE(3);
  data[12] = 1;
  creator.publicKey.toBuffer().copy(data, 13);
  accounts.set(
    PROGRAM_ID.toBase58(),
    account(program, UPGRADEABLE_LOADER_ID, true),
  );
  accounts.set(programData.toBase58(), account(data, UPGRADEABLE_LOADER_ID));
  if (initialized) {
    accounts.set(
      adminConfigAddress().toBase58(),
      account(
        await coder.accounts.encode('AdminConfig', {
          admins: [creator.publicKey],
          reserved: Array(128).fill(0),
        }),
      ),
    );
    const mint = Buffer.alloc(MintLayout.span);
    MintLayout.encode(
      {
        mintAuthorityOption: 1,
        mintAuthority: paymentMintAddress(),
        supply: 0n,
        decimals: 6,
        isInitialized: true,
        freezeAuthorityOption: 0,
        freezeAuthority: PublicKey.default,
      },
      mint,
    );
    accounts.set(
      paymentMintAddress().toBase58(),
      account(mint, TOKEN_PROGRAM_ID),
    );
    accounts.set(
      tree.toBase58(),
      account(
        await coder.accounts.encode('Tree', {
          creator: creator.publicKey,
          seed_id: Array.from(Buffer.from(new BN(treeId).toArray('le', 8))),
          bump: PublicKey.findProgramAddressSync(
            [
              Buffer.from('tree'),
              creator.publicKey.toBuffer(),
              Buffer.from(new BN(treeId).toArray('le', 8)),
            ],
            PROGRAM_ID,
          )[1],
          supplier,
          client: clientWallet,
          reporter,
          payment_mint: paymentMintAddress(),
          share_mint: shareMintAddress(tree),
          target: new BN('18446744073709551615'),
          raised: new BN('18446744073709551615'),
          phase: { [phase]: {} },
          next_day_start_ts: new BN(dayStartTs),
          total_wh: new BN(96),
          billed: new BN(0),
          paid: new BN(0),
          claimed: new BN(0),
          reward_index: new BN(0),
          reward_remainder: new BN(0),
          reserved: Array(128).fill(0),
        }),
      ),
    );
    accounts.set(
      report.toBase58(),
      account(
        await coder.accounts.encode('Report', {
          tree,
          day_start_ts: new BN(dayStartTs),
          submitted_at: new BN('1791158400'),
          reporter,
          wh: Array(96).fill(1),
          total_wh: new BN(96),
          invoice_issued: invoice,
          due: new BN(0),
          paid: new BN(0),
          reserved: Array(128).fill(0),
        }),
      ),
    );
  }
  const methods: string[] = [];
  const sent: Transaction[] = [];
  const server = Bun.serve({
    port: 0,
    hostname: '127.0.0.1',
    async fetch(request) {
      const { method, params, id } = await request.json();
      methods.push(method);
      let result: unknown;
      switch (method) {
        case 'getGenesisHash':
          result = genesis;
          break;
        case 'getMultipleAccounts':
          result = {
            context: { slot: 1 },
            value: params[0].map((address: string) =>
              jsonAccount(accounts.get(address) ?? null),
            ),
          };
          break;
        case 'getAccountInfo':
          if (params[0] === tree.toBase58())
            return Response.json({
              jsonrpc: '2.0',
              id,
              error: {
                code: -32601,
                message: 'Tree reads must use the backend',
              },
            });
          result = {
            context: { slot: 1 },
            value: jsonAccount(accounts.get(params[0]) ?? null),
          };
          break;
        case 'getBalance':
          result = { context: { slot: 1 }, value: 5_000_000_000 };
          break;
        case 'getProgramAccounts': {
          const filters = params[1].filters;
          const isReport = filters.length > 1;
          const address = isReport ? report : tree;
          const value = accounts.get(address.toBase58());
          result = value
            ? [{ pubkey: address.toBase58(), account: jsonAccount(value) }]
            : [];
          break;
        }
        case 'getLatestBlockhash':
          result = {
            context: { slot: 1 },
            value: { blockhash, lastValidBlockHeight: 1000 },
          };
          break;
        case 'sendTransaction': {
          const tx = Transaction.from(Buffer.from(params[0], 'base64'));
          sent.push(tx);
          await onSend?.(tx, accounts);
          result = bs58.encode(tx.signature!);
          break;
        }
        case 'getSignatureStatuses':
          result = {
            context: { slot: 1 },
            value: [
              {
                slot: 1,
                confirmations: 1,
                err: failed
                  ? { InstructionError: [0, { Custom: 6000 }] }
                  : null,
                confirmationStatus: 'confirmed',
              },
            ],
          };
          break;
        default:
          return Response.json({
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: 'Unexpected method ' + method },
          });
      }
      return Response.json({ jsonrpc: '2.0', id, result });
    },
  });
  dispose.push(() => server.stop(true));
  const client = new AdminChainClient(
    new Connection(`http://127.0.0.1:${server.port}`, {
      commitment: 'confirmed',
      disableRetryOnRateLimit: true,
    }),
  );
  return { client, accounts, methods, sent };
}
function signedWallet(keypair = creator): ConnectedWallet {
  return {
    address: keypair.publicKey.toBase58(),
    signMessage: async () => new Uint8Array(64),
    signTransaction: async (transaction) => {
      transaction.sign(keypair);
      return transaction;
    },
    sendTransaction: async (transaction, connection, options) => {
      transaction.sign(keypair);
      return connection.sendRawTransaction(transaction.serialize(), options);
    },
  };
}
function backendTree(phase: TreeInfo['phase'] = 'purchased'): TreeInfo {
  return {
    id: '00000000-0000-4000-8000-000000000001',
    address: tree.toBase58(),
    treeId,
    creator: creator.publicKey.toBase58(),
    supplier: supplier.toBase58(),
    client: clientWallet.toBase58(),
    reporter: reporter.toBase58(),
    paymentMint: paymentMintAddress().toBase58(),
    shareMint: shareMintAddress(tree).toBase58(),
    fundingTokenAccount: fundingVaultAddress(tree).toBase58(),
    target: '18446744073709551615',
    raised: '18446744073709551615',
    remaining: '0',
    phase,
    canBuy: false,
    updatedAt: '2026-10-04T00:00:00Z',
    signature: 'test-signature',
  };
}

export function setTokenBalance(
  accounts: Map<string, AccountInfo<Buffer>>,
  owner: PublicKey,
  amount: bigint,
  address = paymentAtaAddress(owner),
) {
  const data = Buffer.alloc(AccountLayout.span);
  AccountLayout.encode(
    {
      mint: paymentMintAddress(),
      owner,
      amount,
      delegateOption: 0,
      delegate: PublicKey.default,
      state: 1,
      isNativeOption: 0,
      isNative: 0n,
      delegatedAmount: 0n,
      closeAuthorityOption: 0,
      closeAuthority: PublicKey.default,
    },
    data,
  );
  accounts.set(address.toBase58(), account(data, TOKEN_PROGRAM_ID));
}
export async function setInvestorRewards(
  accounts: Map<string, AccountInfo<Buffer>>,
  {
    owner = other.publicKey,
    paid = 5_000_000n,
    claimed = 0n,
    shares = 20_000_000_000n,
    index = 250_000_000_000_000n,
    positionIndex = 0n,
    pendingScaled = 0n,
    vaultBalance = paid - claimed,
  } = {},
) {
  const original = accounts.get(tree.toBase58())!;
  const state = coder.accounts.decode<Record<string, unknown>>(
    'Tree',
    original.data,
  );
  original.data = await coder.accounts.encode('Tree', {
    ...state,
    target: new BN('20000000000'),
    raised: new BN('20000000000'),
    paid: new BN(paid.toString()),
    claimed: new BN(claimed.toString()),
    reward_index: new BN(index.toString()),
  });
  accounts.set(
    positionAddress(tree, owner).toBase58(),
    account(
      await coder.accounts.encode('Position', {
        tree,
        owner,
        shares: new BN(shares.toString()),
        index: new BN(positionIndex.toString()),
        pending_scaled: new BN(pendingScaled.toString()),
        reserved: Array(128).fill(0),
      }),
    ),
  );
  setTokenBalance(accounts, tree, vaultBalance, revenueVaultAddress(tree));
}
export {
  fixture,
  coder,
  creator,
  other,
  supplier,
  clientWallet,
  reporter,
  tree,
  treeId,
  programData,
  report,
  dayStartTs,
  signedWallet,
  backendTree,
};
