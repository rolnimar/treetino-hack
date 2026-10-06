import { BN, BorshCoder } from '@anchor-lang/core';
import { PublicKey, type AccountInfo } from '@solana/web3.js';
import { TREETINO_IDL, TREETINO_PROGRAM_ID } from '@treetino/contracts';
import type { IndexedReportInput } from '../database/schema';

const coder = new BorshCoder(TREETINO_IDL);
const programId = new PublicKey(TREETINO_PROGRAM_ID);

export function reportAddress(tree: PublicKey, day: string) {
  const seed = Buffer.alloc(8);
  seed.writeBigInt64LE(BigInt(day));
  return PublicKey.findProgramAddressSync(
    [Buffer.from('report'), tree.toBuffer(), seed],
    programId,
  )[0];
}

export function decodeReport(
  address: string,
  tree: string,
  account: AccountInfo<Buffer> | null,
): IndexedReportInput {
  if (!account || !account.owner.equals(programId) || account.executable)
    throw new Error(`Report account unavailable or invalid: ${address}`);
  const report = coder.accounts.decode<{
    tree: PublicKey;
    day_start_ts: BN;
    submitted_at: BN;
    reporter: PublicKey;
    wh: number[];
    total_wh: BN;
    invoice_issued: boolean;
    due: BN;
    paid: BN;
  }>('Report', account.data);
  const dayStartTs = report.day_start_ts.toString();
  if (
    report.tree.toBase58() !== tree ||
    reportAddress(report.tree, dayStartTs).toBase58() !== address
  )
    throw new Error(`Invalid report PDA or tree: ${address}`);
  return {
    address,
    tree,
    dayStartTs,
    submittedAt: report.submitted_at.toString(),
    reporter: report.reporter.toBase58(),
    wh: report.wh,
    totalWh: report.total_wh.toString(),
    invoiceIssued: report.invoice_issued,
    due: report.due.toString(),
    paid: report.paid.toString(),
  };
}
