import { Buffer } from 'buffer';
import { BN, BorshCoder, type Idl } from '@anchor-lang/core';
import { Connection, PublicKey, type AccountInfo } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, unpackMint } from '@solana/spl-token';
import bs58 from 'bs58';
import { TREETINO_IDL } from '@treetino/contracts';
import {
  PROGRAM_ID,
  UPGRADEABLE_LOADER_ID,
  adminConfigAddress,
  paymentMintAddress,
  reportAddress,
} from './addresses';
import { chainStateSchema, reportsSchema } from '../features/admin/schemas';
const idl = TREETINO_IDL as unknown as Idl;
const coder = new BorshCoder(idl);
import { assertDevnet } from './network';
export { DEVNET_GENESIS } from './network';
function decode<T>(name: string, account: AccountInfo<Buffer> | null): T {
  if (!account) throw new Error(`${name} account does not exist`);
  if (!account.owner.equals(PROGRAM_ID) || account.executable)
    throw new Error(`Invalid ${name} account owner`);
  try {
    return coder.accounts.decode<T>(name, account.data);
  } catch {
    throw new Error(
      `${name} account does not match the current program layout`,
    );
  }
}
interface ReportAccount {
  tree: PublicKey;
  day_start_ts: BN;
  total_wh: BN;
  invoice_issued: boolean;
  due: BN;
  paid: BN;
}
export async function readProtocolState(
  connection: Connection,
  wallet: string,
) {
  await assertDevnet(connection);
  const signer = new PublicKey(wallet);
  const [program, adminsAccount, mintAccount] =
    await connection.getMultipleAccountsInfo([
      PROGRAM_ID,
      adminConfigAddress(),
      paymentMintAddress(),
    ]);
  if (
    !program?.executable ||
    !program.owner.equals(UPGRADEABLE_LOADER_ID) ||
    program.data.length < 36 ||
    program.data.readUInt32LE(0) !== 2
  )
    throw new Error('Upgradeable Treetino program is not deployed on this RPC');
  const programData = new PublicKey(program.data.subarray(4, 36));
  const [data, balance] = await Promise.all([
    connection.getAccountInfo(programData),
    connection.getBalance(signer),
  ]);
  if (
    !data ||
    !data.owner.equals(UPGRADEABLE_LOADER_ID) ||
    data.data.length < 13 ||
    data.data.readUInt32LE(0) !== 3 ||
    ![0, 1].includes(data.data[12]) ||
    (data.data[12] === 1 && data.data.length < 45)
  )
    throw new Error('Invalid program upgrade authority account');
  const upgradeAuthority =
    data.data[12] === 1
      ? new PublicKey(data.data.subarray(13, 45)).toBase58()
      : null;
  const admins = adminsAccount
    ? decode<{ admins: PublicKey[] }>('AdminConfig', adminsAccount).admins.map(
        (wallet) => wallet.toBase58(),
      )
    : [];
  if (mintAccount) {
    const mint = unpackMint(
      paymentMintAddress(),
      mintAccount,
      TOKEN_PROGRAM_ID,
    );
    if (
      mint.decimals !== 6 ||
      !mint.mintAuthority?.equals(paymentMintAddress()) ||
      mint.freezeAuthority ||
      !mint.isInitialized
    )
      throw new Error(
        'Existing payment mint is incompatible with this program',
      );
  }
  return chainStateSchema.parse({
    network: 'devnet',
    programId: PROGRAM_ID.toBase58(),
    programData: programData.toBase58(),
    upgradeAuthority,
    adminConfig: adminConfigAddress().toBase58(),
    adminsInitialized: !!adminsAccount,
    admins,
    paymentMint: paymentMintAddress().toBase58(),
    paymentTokenInitialized: !!mintAccount,
    wallet,
    balanceLamports: balance.toString(),
  });
}
export async function readReports(connection: Connection, address: string) {
  await assertDevnet(connection);
  const pubkey = new PublicKey(address);
  const discriminator = idl.accounts!.find(
    (account) => account.name === 'Report',
  )!.discriminator;
  const rows = await connection.getProgramAccounts(PROGRAM_ID, {
    filters: [
      {
        memcmp: {
          offset: 0,
          bytes: bs58.encode(Uint8Array.from(discriminator)),
        },
      },
      { memcmp: { offset: 8, bytes: pubkey.toBase58() } },
    ],
  });
  return reportsSchema.parse(
    rows
      .map(({ pubkey: address, account }) => {
        const report = decode<ReportAccount>('Report', account);
        if (
          !report.tree.equals(pubkey) ||
          !reportAddress(pubkey, report.day_start_ts.toString()).equals(address)
        )
          throw new Error('Invalid report PDA');
        return {
          address: address.toBase58(),
          dayStartTs: report.day_start_ts.toString(),
          totalWh: report.total_wh.toString(),
          invoiceIssued: report.invoice_issued,
          due: report.due.toString(),
          paid: report.paid.toString(),
        };
      })
      .sort((a, b) => Number(BigInt(b.dayStartTs) - BigInt(a.dayStartTs))),
  );
}
