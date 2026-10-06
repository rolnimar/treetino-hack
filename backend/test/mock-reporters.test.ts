import 'reflect-metadata';
import { afterEach, expect, test } from 'bun:test';
import { BN, BorshCoder } from '@anchor-lang/core';
import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import bs58 from 'bs58';
import { TREETINO_IDL, TREETINO_PROGRAM_ID } from '@treetino/contracts';
import { testDatabase } from './database.fixture';
import { DatabaseService } from '../dist/database/database.service.js';
import {
  MockReporterService,
  DEVNET_GENESIS,
} from '../dist/mock-reporters/mock-reporter.service.js';
import { reportAddress } from '../dist/indexer/report.decoder.js';

const coder = new BorshCoder(TREETINO_IDL);
const program = new PublicKey(TREETINO_PROGRAM_ID);
const stream = `${DEVNET_GENESIS}:${TREETINO_PROGRAM_ID}`;
const day = 1791072000;
const date = '2026-10-04';
const cleanup: (() => Promise<void>)[] = [];
afterEach(async () => {
  for (const dispose of cleanup.splice(0).reverse()) await dispose();
});

async function fixture() {
  const testDb = await testDatabase();
  cleanup.push(() => testDb.cleanup());
  const database = await DatabaseService.create(testDb.config);
  cleanup.push(() => database.onApplicationShutdown());
  const accounts = new Map<string, Buffer>();
  const sent: Buffer[] = [];
  let balance = 50_000_000,
    now = day + 86400,
    height = 1;
  let failed: unknown = null,
    offline = false,
    genesis = DEVNET_GENESIS;
  const rpc = {
    getGenesisHash: async () => genesis,
    connection: {
      getAccountInfo: async (address: PublicKey) => {
        const data = accounts.get(address.toBase58());
        return data
          ? { data, owner: program, executable: false, lamports: 10_000 }
          : null;
      },
      getBalance: async () => balance,
      getSlot: async () => 1,
      getBlockTime: async () => now,
      getBlockHeight: async () => height,
      getMinimumBalanceForRentExemption: async () => 1_000_000,
      getLatestBlockhash: async () => ({
        blockhash: Keypair.generate().publicKey.toBase58(),
        lastValidBlockHeight: 100,
      }),
      getSignatureStatuses: async () => ({
        value: [failed ? { err: failed } : null],
      }),
      sendRawTransaction: async (bytes: Buffer) => {
        sent.push(Buffer.from(bytes));
        const [persisted] =
          await testDb.sql`SELECT raw_transaction FROM mock_report_jobs WHERE signature = ${bs58.encode(Transaction.from(bytes).signature!)}`;
        expect(persisted.raw_transaction).toBe(
          Buffer.from(bytes).toString('base64'),
        );
        if (offline)
          throw new Error('simulated connection failure after broadcast');
        return bs58.encode(Transaction.from(bytes).signature!);
      },
    },
  };
  const service = new MockReporterService(database, rpc as never);
  const creator = Keypair.generate().publicKey.toBase58();
  const activate = async (
    info: Awaited<ReturnType<typeof service.prepare>>,
  ) => {
    const seed = Buffer.alloc(8);
    seed.writeBigUInt64LE(1n);
    accounts.set(
      info.tree,
      await coder.accounts.encode('Tree', {
        creator: new PublicKey(creator),
        seed_id: [...seed],
        bump: 255,
        supplier: program,
        client: program,
        reporter: new PublicKey(info.wallet),
        payment_mint: program,
        share_mint: program,
        target: new BN(1),
        raised: new BN(1),
        phase: { Active: {} },
        next_day_start_ts: new BN(day),
        total_wh: new BN(0),
        billed: new BN(0),
        paid: new BN(0),
        claimed: new BN(0),
        reward_index: new BN(0),
        reward_remainder: new BN(0),
        reserved: Array(128).fill(0),
      }),
    );
    await testDb.sql`INSERT INTO indexer_state (stream,start_time) VALUES (${stream}, ${day})`;
    await testDb.sql`INSERT INTO indexed_trees (stream,address,tree_id,creator,supplier,client,reporter,payment_mint,share_mint,funding_token_account,target,raised,phase,signature,block_time) VALUES (${stream},${info.tree},'1',${creator},'supplier','client',${info.wallet},'mint','shares','funding','1','1','active','init',${day})`;
  };
  return {
    testDb,
    database,
    rpc,
    service,
    creator,
    accounts,
    sent,
    activate,
    balance: (value: number) => {
      balance = value;
    },
    now: (value: number) => {
      now = value;
    },
    height: (value: number) => {
      height = value;
    },
    failed: (value: unknown) => {
      failed = value;
    },
    offline: (value: boolean) => {
      offline = value;
    },
    genesis: (value: string) => {
      genesis = value;
    },
  };
}

test('concurrent preparation and restart reuse a private key without exposing it; distinct tree IDs get distinct wallets', async () => {
  const f = await fixture();
  const [one, two] = await Promise.all([
    f.service.prepare(f.creator, '1'),
    f.service.prepare(f.creator, '1'),
  ]);
  expect(one).toEqual(two);
  expect(one.id).toMatch(/^[0-9a-f-]{36}$/);
  expect(one).not.toHaveProperty('secretKey');
  expect(await f.service.status(one.tree)).toEqual(one);
  const [stored] = await f.testDb
    .sql`SELECT secret_key FROM mock_reporters WHERE id = ${one.id}`;
  expect(
    Keypair.fromSecretKey(bs58.decode(stored.secret_key)).publicKey.toBase58(),
  ).toBe(one.wallet);
  const reopened = await DatabaseService.create(f.testDb.config);
  cleanup.push(() => reopened.onApplicationShutdown());
  const resumed = new MockReporterService(reopened, f.rpc as never);
  expect(await resumed.prepare(f.creator, '1')).toEqual(one);
  expect((await resumed.prepare(f.creator, '2')).wallet).not.toBe(one.wallet);
  for (const invalid of ['-1', '01', '18446744073709551616', 1])
    await expect(resumed.prepare(f.creator, invalid)).rejects.toThrow('u64');
  f.genesis('mainnet');
  await expect(resumed.prepare(f.creator, '3')).rejects.toThrow('devnet');
  expect((await f.testDb.sql`SELECT * FROM mock_reporters`).length).toBe(2);
});

test('manual simulation enforces ownership, waits for completed days, and reuses the worker lease and saved transaction', async () => {
  const f = await fixture();
  const info = await f.service.prepare(f.creator, '1');
  await f.activate(info);
  await expect(
    f.service.simulate(info.tree, info.wallet, date),
  ).rejects.toThrow('creator');
  await expect(
    f.service.simulate(program.toBase58(), f.creator, date),
  ).rejects.toThrow('No backend mock reporter');
  f.now(day + 86399);
  expect(await f.service.simulate(info.tree, f.creator, date)).toMatchObject({
    status: 'waiting',
    signature: null,
    dayStartTs: String(day),
  });
  expect(f.sent).toHaveLength(0);
  const preview = await f.service.simulation(info.tree, f.creator, date);
  expect(preview).toMatchObject({
    tree: info.tree,
    reporter: info.wallet,
    ready: false,
    dayStartTs: String(day),
  });
  expect(preview.wh).toHaveLength(96);
  await expect(
    f.service.simulation(
      info.tree,
      Keypair.generate().publicKey.toBase58(),
      date,
    ),
  ).rejects.toThrow('creator or reporter');
  f.now(day + 86400);
  expect((await f.service.simulation(info.tree, info.wallet, date)).ready).toBe(
    true,
  );
  await f.testDb
    .sql`UPDATE mock_reporters SET lease_until=${Date.now() + 300000} WHERE id=${info.id}`;
  expect((await f.service.simulate(info.tree, f.creator, date)).status).toBe(
    'busy',
  );
  expect(f.sent).toHaveLength(0);
  await f.testDb
    .sql`UPDATE mock_reporters SET lease_until=0 WHERE id=${info.id}`;
  const result = await f.service.simulate(info.tree, f.creator, date);
  expect(result).toMatchObject({
    status: 'submitted',
    report: reportAddress(new PublicKey(info.tree), String(day)).toBase58(),
    dayStartTs: String(day),
  });
  expect(result.signature).toBe(
    bs58.encode(Transaction.from(f.sent[0]!).signature!),
  );
  expect(Transaction.from(f.sent[0]!).verifySignatures()).toBe(true);
  await f.service.simulate(info.tree, f.creator, date);
  expect(f.sent[1]).toEqual(f.sent[0]);
  expect(await f.testDb.sql`SELECT * FROM mock_report_jobs`).toHaveLength(1);
});

test('selected historical days get distinct signed jobs and retries never submit a different pending day', async () => {
  const f = await fixture();
  const info = await f.service.prepare(f.creator, '1');
  await f.activate(info);
  f.now(day + 2 * 86400);
  const recent = await f.service.simulate(info.tree, f.creator, '2026-10-05');
  const olderDay = String(day - 4 * 86400);
  const older = await f.service.simulate(info.tree, f.creator, '2026-09-30');
  expect(older.dayStartTs).toBe(olderDay);
  expect(recent.dayStartTs).toBe(String(day + 86400));
  expect(older.report).not.toBe(recent.report);
  const decoded = coder.instruction.decode(
    Transaction.from(f.sent[1]!).instructions[0]!.data,
  )!;
  expect((decoded.data as { day_start_ts: BN }).day_start_ts.toString()).toBe(
    olderDay,
  );
  expect(await f.testDb.sql`SELECT * FROM mock_report_jobs`).toHaveLength(2);
  await f.service.simulate(info.tree, f.creator, '2026-09-30');
  expect(f.sent[2]).toEqual(f.sent[1]);
  expect(
    (await f.service.simulation(info.tree, f.creator, '2026-09-30')).dayStartTs,
  ).toBe(olderDay);
  f.accounts.set(
    older.report!,
    await coder.accounts.encode('Report', {
      tree: new PublicKey(info.tree),
      day_start_ts: new BN(olderDay),
      submitted_at: new BN(day + 2 * 86400),
      reporter: new PublicKey(info.wallet),
      wh: [1, 2],
      total_wh: new BN(3),
      invoice_issued: false,
      due: new BN(0),
      paid: new BN(0),
      reserved: Array(128).fill(0),
    }),
  );
  const preview = await f.service.simulation(
    info.tree,
    f.creator,
    '2026-09-30',
  );
  expect(preview.alreadyReported).toBe(true);
  expect(
    (await f.service.simulate(info.tree, f.creator, '2026-09-30')).status,
  ).toBe('already-submitted');
  expect(f.sent).toHaveLength(3);
  for (const invalid of [
    undefined,
    '',
    '2026-02-30',
    '1969-12-31',
    '2026-10-4',
    '2026-10-04T00:00:00Z',
    1791072000,
  ]) {
    await expect(
      f.service.simulate(info.tree, f.creator, invalid),
    ).rejects.toThrow('day must');
    await expect(
      f.service.simulation(info.tree, f.creator, invalid),
    ).rejects.toThrow('day must');
  }
});

test('only completed active-tree days are reported; signed bytes survive broadcast failure and restart', async () => {
  const f = await fixture();
  const info = await f.service.prepare(f.creator, '1');
  await f.activate(info);
  f.now(day + 86399);
  await f.service.run();
  expect(f.sent).toHaveLength(0);
  f.now(day + 86400);
  f.balance(0);
  await f.service.run();
  expect((await f.service.status(info.tree))!.lastError).toContain(
    'devnet SOL',
  );
  expect(f.sent).toHaveLength(0);
  f.balance(50_000_000);
  f.offline(true);
  await f.service.run();
  expect(f.sent).toHaveLength(1);
  const tx = Transaction.from(f.sent[0]!);
  expect(tx.verifySignatures()).toBe(true);
  expect(tx.feePayer!.toBase58()).toBe(info.wallet);
  expect(tx.signatures).toHaveLength(1);
  const ix = tx.instructions[0]!;
  const decoded = coder.instruction.decode(ix.data)!;
  expect(decoded.name).toBe('submit_report');
  expect((decoded.data as { day_start_ts: BN }).day_start_ts.toString()).toBe(
    String(day),
  );
  expect(ix.keys[1]!.pubkey.toBase58()).toBe(info.tree);
  const report = reportAddress(new PublicKey(info.tree), String(day));
  expect(ix.keys[2]!.pubkey.equals(report)).toBe(true);
  f.offline(false);
  const resumed = new MockReporterService(f.database, f.rpc as never);
  await resumed.run();
  expect(f.sent[1]).toEqual(f.sent[0]);
  expect((await f.testDb.sql`SELECT * FROM mock_report_jobs`).length).toBe(1);
  f.accounts.set(
    report.toBase58(),
    await coder.accounts.encode('Report', {
      tree: new PublicKey(info.tree),
      day_start_ts: new BN(day),
      submitted_at: new BN(day + 86400),
      reporter: new PublicKey(info.wallet),
      wh: [],
      total_wh: new BN(0),
      invoice_issued: false,
      due: new BN(0),
      paid: new BN(0),
      reserved: Array(128).fill(0),
    }),
  );
  await resumed.run();
  expect(f.sent).toHaveLength(2);
  expect(
    (await f.testDb.sql`SELECT confirmed FROM mock_report_jobs`)[0]!.confirmed,
  ).toBe(true);
  expect((await resumed.status(info.tree))!.lastError).toBeNull();
});

test('leases serialize workers, expired transactions are replaced, and failed transactions can recover', async () => {
  const f = await fixture();
  const info = await f.service.prepare(f.creator, '1');
  await f.activate(info);
  await Promise.all([
    f.service.run(),
    new MockReporterService(f.database, f.rpc as never).run(),
  ]);
  const jobs = await f.testDb.sql`SELECT * FROM mock_report_jobs`;
  expect(jobs).toHaveLength(1);
  expect(new Set(f.sent.map((bytes) => bytes.toString('base64'))).size).toBe(1);
  f.height(101);
  await f.service.run();
  const [replacement] = await f.testDb.sql`SELECT * FROM mock_report_jobs`;
  expect(replacement.signature).not.toBe(jobs[0]!.signature);
  expect(replacement.report).toBe(jobs[0]!.report);
  f.failed({ InstructionError: [0, { Custom: 1 }] });
  await f.service.run();
  expect(await f.testDb.sql`SELECT * FROM mock_report_jobs`).toHaveLength(0);
  expect((await f.service.status(info.tree))!.lastError).toContain(
    'transaction failed',
  );
  f.failed(null);
  f.height(1);
  await f.service.run();
  expect(await f.testDb.sql`SELECT * FROM mock_report_jobs`).toHaveLength(1);
});
