import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  Injectable,
} from '@nestjs/common';
import { randomUUID, createHash } from 'node:crypto';
import { BN, BorshCoder } from '@anchor-lang/core';
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import bs58 from 'bs58';
import { and, eq, lt, sql } from 'drizzle-orm';
import {
  TREETINO_IDL,
  TREETINO_PROGRAM_ID,
  type MockReporterInfo,
  type MockReportResult,
  type ReportSimulation,
} from '@treetino/contracts';
import { DatabaseService } from '../database/database.service';
import {
  indexedTrees,
  mockReporters,
  mockReportJobs,
} from '../database/schema';
import { SolanaRpcService } from '../indexer/solana-rpc.service';
import { decodeReport, reportAddress } from '../indexer/report.decoder';
import { reportDayTimestamp } from './report-day';

export const DEVNET_GENESIS = 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';
const program = new PublicKey(TREETINO_PROGRAM_ID);
const stream = `${DEVNET_GENESIS}:${TREETINO_PROGRAM_ID}`;
const coder = new BorshCoder(TREETINO_IDL);
const DAY = 86400n;
type Reporter = typeof mockReporters.$inferSelect;

/** Deterministic demo production, not a validation rule for supplied energy data. */
export function mockReadings(tree: string, day: string) {
  const seed = createHash('sha256').update(`${tree}:${day}`).digest();
  return Array.from({ length: 96 }, (_, index) => {
    const hour = index / 4;
    const daylight = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
    return Math.round(daylight * (700 + seed[index % seed.length]!));
  });
}
function publicInfo(row: Reporter): MockReporterInfo {
  return {
    id: row.id,
    tree: row.tree,
    wallet: row.wallet,
    lastSignature: row.lastSignature,
    lastError: row.lastError,
    balanceLamports: row.balanceLamports,
  };
}

function outcome(
  status: MockReportResult['status'],
  message: string,
  dayStartTs: string | null = null,
  report: string | null = null,
  signature: string | null = null,
): MockReportResult {
  return { status, message, dayStartTs, report, signature };
}

@Injectable()
export class MockReporterService {
  constructor(
    private readonly database: DatabaseService,
    private readonly rpc: SolanaRpcService,
  ) {}

  async assertDevnet() {
    if ((await this.rpc.getGenesisHash()) !== DEVNET_GENESIS)
      throw new BadRequestException(
        'Mock reporters are only available on Solana devnet',
      );
  }
  async prepare(creator: string, treeId: unknown) {
    if (
      typeof treeId !== 'string' ||
      !/^(0|[1-9]\d{0,19})$/.test(treeId) ||
      BigInt(treeId) > 18446744073709551615n
    )
      throw new BadRequestException('treeId must be a u64 decimal string');
    await this.assertDevnet();
    const seed = Buffer.alloc(8);
    seed.writeBigUInt64LE(BigInt(treeId));
    const tree = PublicKey.findProgramAddressSync(
      [Buffer.from('tree'), new PublicKey(creator).toBuffer(), seed],
      program,
    )[0];
    const existing = await this.rpc.connection.getAccountInfo(
      tree,
      'confirmed',
    );
    if (existing) {
      if (!existing.owner.equals(program) || existing.executable)
        throw new ConflictException('Tree address is already occupied');
      const chainTree = coder.accounts.decode<{ reporter: PublicKey }>(
        'Tree',
        existing.data,
      );
      const [stored] = await this.database.db
        .select()
        .from(mockReporters)
        .where(
          and(
            eq(mockReporters.stream, stream),
            eq(mockReporters.tree, tree.toBase58()),
          ),
        );
      if (!stored || chainTree.reporter.toBase58() !== stored.wallet)
        throw new ConflictException(
          'Existing tree uses a different reporter; create a new tree ID',
        );
      return publicInfo(stored);
    }
    const key = Keypair.generate();
    await this.database.db
      .insert(mockReporters)
      .values({
        stream,
        tree: tree.toBase58(),
        creator,
        wallet: key.publicKey.toBase58(),
        secretKey: bs58.encode(key.secretKey),
      })
      .onConflictDoNothing();
    const [saved] = await this.database.db
      .select()
      .from(mockReporters)
      .where(
        and(
          eq(mockReporters.stream, stream),
          eq(mockReporters.tree, tree.toBase58()),
        ),
      );
    return publicInfo(saved!);
  }
  async status(tree: string) {
    const [row] = await this.database.db
      .select({
        id: mockReporters.id,
        tree: mockReporters.tree,
        wallet: mockReporters.wallet,
        lastSignature: mockReporters.lastSignature,
        lastError: mockReporters.lastError,
        balanceLamports: mockReporters.balanceLamports,
      })
      .from(mockReporters)
      .where(
        and(eq(mockReporters.stream, stream), eq(mockReporters.tree, tree)),
      );
    return row ?? null;
  }
  async simulate(tree: string, creator: string, day: unknown) {
    const timestamp = reportDayTimestamp(day);
    await this.assertDevnet();
    const [reporter] = await this.database.db
      .select()
      .from(mockReporters)
      .where(
        and(eq(mockReporters.stream, stream), eq(mockReporters.tree, tree)),
      );
    if (!reporter)
      throw new NotFoundException(
        'No backend mock reporter is configured for this tree',
      );
    if (reporter.creator !== creator)
      throw new ForbiddenException(
        'Only this tree creator can simulate backend reports',
      );
    return this.process(reporter, true, timestamp);
  }

  async simulation(
    treeAddress: string,
    wallet: string,
    day: unknown,
  ): Promise<ReportSimulation> {
    const dayStartTs = reportDayTimestamp(day);
    await this.assertDevnet();
    let tree: PublicKey;
    try {
      tree = new PublicKey(treeAddress);
      if (tree.toBase58() !== treeAddress) throw new Error();
    } catch {
      throw new BadRequestException('Invalid tree address');
    }
    const account = await this.rpc.connection.getAccountInfo(tree, 'confirmed');
    if (!account || !account.owner.equals(program) || account.executable)
      throw new NotFoundException('Tree account unavailable');
    const state = coder.accounts.decode<{
      creator: PublicKey;
      seed_id: number[];
      reporter: PublicKey;
      phase: Record<string, unknown>;
      next_day_start_ts: BN;
    }>('Tree', account.data);
    const expected = PublicKey.findProgramAddressSync(
      [
        Buffer.from('tree'),
        state.creator.toBuffer(),
        Buffer.from(state.seed_id),
      ],
      program,
    )[0];
    if (!expected.equals(tree))
      throw new BadRequestException('Invalid tree PDA');
    if (
      wallet !== state.creator.toBase58() &&
      wallet !== state.reporter.toBase58()
    )
      throw new ForbiddenException(
        'Only this tree creator or reporter can prepare a simulation',
      );
    const readyAt = Number(BigInt(dayStartTs) + DAY);
    const now = await this.rpc.connection.getBlockTime(
      await this.rpc.connection.getSlot('confirmed'),
    );
    if (now === null)
      throw new BadRequestException('Confirmed chain time unavailable');
    const address = reportAddress(tree, dayStartTs);
    const reportAccount = await this.rpc.connection.getAccountInfo(
      address,
      'confirmed',
    );
    if (reportAccount)
      decodeReport(address.toBase58(), treeAddress, reportAccount);
    return {
      tree: treeAddress,
      reporter: state.reporter.toBase58(),
      dayStartTs,
      readyAt: new Date(readyAt * 1000).toISOString(),
      ready: 'Active' in state.phase && readyAt <= now,
      alreadyReported: !!reportAccount,
      wh: mockReadings(treeAddress, dayStartTs),
    };
  }

  async run() {
    await this.assertDevnet();
    const rows = await this.database.db
      .select({ reporter: mockReporters })
      .from(mockReporters)
      .innerJoin(
        indexedTrees,
        and(
          eq(indexedTrees.stream, mockReporters.stream),
          eq(indexedTrees.address, mockReporters.tree),
          eq(indexedTrees.reporter, mockReporters.wallet),
        ),
      )
      .where(
        and(eq(mockReporters.stream, stream), eq(indexedTrees.phase, 'active')),
      );
    for (const { reporter } of rows) await this.process(reporter);
  }

  private async process(
    reporter: Reporter,
    propagateErrors = false,
    selectedDay?: string,
  ): Promise<MockReportResult> {
    const owner = randomUUID();
    const [claimed] = await this.database.db
      .update(mockReporters)
      .set({
        leaseOwner: owner,
        leaseUntil: sql`(extract(epoch from clock_timestamp()) * 1000)::bigint + 300000`,
      })
      .where(
        and(
          eq(mockReporters.id, reporter.id),
          lt(
            mockReporters.leaseUntil,
            sql`(extract(epoch from clock_timestamp()) * 1000)::bigint`,
          ),
        ),
      )
      .returning({ id: mockReporters.id });
    if (!claimed)
      return outcome(
        'busy',
        'This reporter is already processing a report. Refresh shortly.',
      );
    try {
      const result = await this.sendNextReport(reporter, selectedDay);
      await this.database.db
        .update(mockReporters)
        .set({ lastError: null })
        .where(eq(mockReporters.id, reporter.id));
      return result;
    } catch (error) {
      await this.database.db
        .update(mockReporters)
        .set({
          lastError:
            error instanceof Error ? error.message : 'Mock report failed',
        })
        .where(eq(mockReporters.id, reporter.id));
      if (propagateErrors)
        throw new BadRequestException(
          error instanceof Error ? error.message : 'Mock report failed',
        );
      return outcome(
        'waiting',
        error instanceof Error ? error.message : 'Mock report failed',
      );
    } finally {
      await this.database.db
        .update(mockReporters)
        .set({ leaseOwner: null, leaseUntil: 0 })
        .where(
          and(
            eq(mockReporters.id, reporter.id),
            eq(mockReporters.leaseOwner, owner),
          ),
        );
    }
  }

  private async sendNextReport(
    reporter: Reporter,
    selectedDay?: string,
  ): Promise<MockReportResult> {
    const connection = this.rpc.connection;
    const tree = new PublicKey(reporter.tree);
    const account = await connection.getAccountInfo(tree, 'confirmed');
    if (!account || !account.owner.equals(program) || account.executable)
      throw new Error('Tree account unavailable');
    const state = coder.accounts.decode<{
      creator: PublicKey;
      seed_id: number[];
      reporter: PublicKey;
      phase: Record<string, unknown>;
      next_day_start_ts: BN;
    }>('Tree', account.data);
    const expected = PublicKey.findProgramAddressSync(
      [
        Buffer.from('tree'),
        state.creator.toBuffer(),
        Buffer.from(state.seed_id),
      ],
      program,
    )[0];
    if (
      !expected.equals(tree) ||
      state.creator.toBase58() !== reporter.creator ||
      state.reporter.toBase58() !== reporter.wallet
    )
      throw new Error('Tree reporter or creator no longer matches');
    if (!('Active' in state.phase))
      return outcome(
        'waiting',
        'Activate the tree before simulating a report.',
      );
    const key = Keypair.fromSecretKey(bs58.decode(reporter.secretKey));
    if (key.publicKey.toBase58() !== reporter.wallet)
      throw new Error('Stored mock reporter key does not match its wallet');
    const balance = await connection.getBalance(key.publicKey, 'confirmed');
    await this.database.db
      .update(mockReporters)
      .set({ balanceLamports: balance.toString() })
      .where(eq(mockReporters.id, reporter.id));
    // Resolve a saved transaction first, including after a crash immediately after broadcast.
    const [pending] = await this.database.db
      .select()
      .from(mockReportJobs)
      .where(
        and(
          eq(mockReportJobs.reporterId, reporter.id),
          eq(mockReportJobs.confirmed, false),
          selectedDay ? eq(mockReportJobs.dayStartTs, selectedDay) : undefined,
        ),
      )
      .limit(1);
    if (pending) {
      const existing = await connection.getAccountInfo(
        new PublicKey(pending.report),
        'confirmed',
      );
      if (existing) {
        const decoded = decodeReport(pending.report, reporter.tree, existing);
        if (decoded.reporter !== reporter.wallet)
          throw new Error('Report signer does not match mock reporter');
        await this.database.db
          .update(mockReportJobs)
          .set({ confirmed: true })
          .where(eq(mockReportJobs.id, pending.id));
      } else {
        const {
          value: [status],
        } = await connection.getSignatureStatuses([pending.signature], {
          searchTransactionHistory: true,
        });
        if (status?.err) {
          await this.database.db
            .delete(mockReportJobs)
            .where(eq(mockReportJobs.id, pending.id));
          throw new Error(
            `Mock report transaction failed: ${JSON.stringify(status.err)}`,
          );
        }
        if (
          status?.confirmationStatus === 'confirmed' ||
          status?.confirmationStatus === 'finalized'
        )
          throw new Error('Confirmed report account is not available yet');
        if (
          (await connection.getBlockHeight('confirmed')) <=
          pending.lastValidBlockHeight
        ) {
          await connection.sendRawTransaction(
            Buffer.from(pending.rawTransaction, 'base64'),
            { preflightCommitment: 'confirmed', maxRetries: 0 },
          );
          return outcome(
            'submitted',
            'Rebroadcast saved report. The indexer will pick it up after confirmation.',
            pending.dayStartTs,
            pending.report,
            pending.signature,
          );
        }
        // Only an expired transaction can be replaced with a new blockhash.
        await this.database.db
          .delete(mockReportJobs)
          .where(eq(mockReportJobs.id, pending.id));
      }
    }
    const day = BigInt(selectedDay ?? state.next_day_start_ts.toString());
    const slot = await connection.getSlot('confirmed');
    const now = await connection.getBlockTime(slot);
    if (now === null) throw new Error('Confirmed chain time unavailable');
    if (day + DAY > BigInt(now))
      return outcome(
        'waiting',
        `Next report is available after ${new Date(Number(day + DAY) * 1000).toISOString()} when the UTC day is complete.`,
        day.toString(),
      );
    const address = reportAddress(tree, day.toString());
    if (await connection.getAccountInfo(address, 'confirmed'))
      return outcome(
        'already-submitted',
        'This report is already on chain. Wait for the indexer to refresh.',
        day.toString(),
        address.toBase58(),
      );
    const readings = mockReadings(reporter.tree, day.toString());
    const rent = await connection.getMinimumBalanceForRentExemption(
      245 + 4 * readings.length,
      'confirmed',
    );
    if (balance < rent + 100_000)
      throw new Error(
        'Reporter needs devnet SOL for report rent and transaction fees. Fund it from the admin tree card.',
      );
    const block = await connection.getLatestBlockhash('confirmed');
    const transaction = new Transaction({
      feePayer: key.publicKey,
      blockhash: block.blockhash,
      lastValidBlockHeight: block.lastValidBlockHeight,
    }).add(
      new TransactionInstruction({
        programId: program,
        keys: [
          { pubkey: key.publicKey, isSigner: true, isWritable: true },
          { pubkey: tree, isSigner: false, isWritable: true },
          { pubkey: address, isSigner: false, isWritable: true },
          {
            pubkey: SystemProgram.programId,
            isSigner: false,
            isWritable: false,
          },
        ],
        data: coder.instruction.encode('submit_report', {
          day_start_ts: new BN(day.toString()),
          wh: readings,
        }),
      }),
    );
    transaction.sign(key);
    const raw = transaction.serialize();
    const signature = bs58.encode(transaction.signature!);
    // Commit signed bytes before broadcasting so retries reuse exactly the same transaction.
    await this.database.db.insert(mockReportJobs).values({
      reporterId: reporter.id,
      report: address.toBase58(),
      dayStartTs: day.toString(),
      rawTransaction: raw.toString('base64'),
      signature,
      lastValidBlockHeight: block.lastValidBlockHeight,
    });
    await this.database.db
      .update(mockReporters)
      .set({ lastSignature: signature })
      .where(eq(mockReporters.id, reporter.id));
    await connection.sendRawTransaction(raw, {
      preflightCommitment: 'confirmed',
      maxRetries: 0,
    });
    return outcome(
      'submitted',
      'Report submitted. The indexer will pick it up after confirmation.',
      day.toString(),
      address.toBase58(),
      signature,
    );
  }
}
