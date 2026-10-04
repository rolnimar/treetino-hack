import { testDatabase } from './database.fixture';
import { afterEach, describe, expect, test } from 'bun:test';
import { BN, BorshCoder } from '@anchor-lang/core';
import { SchedulerRegistry } from '@nestjs/schedule';
import { PublicKey } from '@solana/web3.js';
import { TREETINO_IDL, TREETINO_PROGRAM_ID } from '@treetino/contracts';
import { IndexerConfig } from '../dist/indexer/indexer.config.js';
import { IndexerService } from '../dist/indexer/indexer.service.js';
import { IndexerRepository } from '../dist/indexer/indexer.repository.js';
import { DatabaseService } from '../dist/database/database.service.js';
import { SolanaRpcService } from '../dist/indexer/solana-rpc.service.js';
import { createApplication } from '../dist/application.js';
import { decodeTree } from '../dist/indexer/tree.decoder.js';

const startTime = Date.parse('2026-10-04T00:00:00Z') / 1000;
const stream = `test-chain:${TREETINO_PROGRAM_ID}`;
const coder = new BorshCoder(TREETINO_IDL);
const seedId = Buffer.alloc(8);
seedId.writeBigUInt64LE(18446744073709551615n);
const creator = PublicKey.default;
const programId = new PublicKey(TREETINO_PROGRAM_ID);
const [treeAddress] = PublicKey.findProgramAddressSync(
  [Buffer.from('tree'), creator.toBuffer(), seedId],
  programId,
);
const shareMint = PublicKey.findProgramAddressSync(
  [Buffer.from('shares'), treeAddress.toBuffer()],
  programId,
)[0];
const treeAccount = await coder.accounts.encode('Tree', {
  creator,
  seed_id: [...seedId],
  bump: 255,
  supplier: programId,
  client: programId,
  reporter: programId,
  payment_mint: PublicKey.findProgramAddressSync(
    [Buffer.from('payment_mint')],
    programId,
  )[0],
  share_mint: shareMint,
  target: new BN('18446744073709551615'),
  raised: new BN(0),
  phase: { Funding: {} },
  next_day_start_ts: new BN(0),
  total_wh: new BN(0),
  billed: new BN(0),
  paid: new BN(0),
  claimed: new BN(0),
  reward_index: new BN(0),
  reward_remainder: new BN(0),
  reserved: Array(128).fill(0),
});

function treeLogs(raised = '0', phase = 'Funding') {
  const discriminator = TREETINO_IDL.events!.find(
    (e) => (e.name as string) === 'TreeChanged',
  )!.discriminator;
  const encoded = Buffer.concat([
    Buffer.from(discriminator),
    coder.types.encode('TreeChanged', {
      tree: treeAddress,
      phase: { [phase]: {} },
      raised: new BN(raised),
    }),
  ]).toString('base64');
  return [
    `Program ${TREETINO_PROGRAM_ID} invoke [1]`,
    `Program data: ${encoded}`,
    `Program ${TREETINO_PROGRAM_ID} success`,
  ];
}
// The JSON IDL retains Rust names; the generated TS type uses client camelCase.
const eventId = TREETINO_IDL.events!.find(
  (event) => (event.name as string) === 'InvoicePaid',
)!.discriminator;
const data = Buffer.concat([
  Buffer.from(eventId),
  coder.types.encode('InvoicePaid', {
    tree: new PublicKey(TREETINO_PROGRAM_ID),
    report: PublicKey.default,
    amount: new BN('18446744073709551615'),
  }),
]).toString('base64');

function signature(id: string, time = startTime, err: unknown = null) {
  return {
    signature: id,
    slot: 100,
    err,
    memo: null,
    blockTime: time,
    confirmationStatus: 'confirmed',
  };
}

function transaction(
  logs = [
    `Program ${TREETINO_PROGRAM_ID} invoke [1]`,
    'Program log: Instruction: PayInvoice',
    `Program data: ${data}`,
    `Program ${TREETINO_PROGRAM_ID} success`,
  ],
) {
  return {
    slot: 100,
    blockTime: startTime,
    transaction: {
      signatures: ['test-signature'],
      message: {
        accountKeys: [TREETINO_PROGRAM_ID],
        header: {
          numRequiredSignatures: 1,
          numReadonlySignedAccounts: 0,
          numReadonlyUnsignedAccounts: 0,
        },
        recentBlockhash: TREETINO_PROGRAM_ID,
        instructions: [],
      },
    },
    meta: {
      err: null,
      fee: 5000,
      preBalances: [10000],
      postBalances: [5000],
      innerInstructions: [],
      logMessages: logs,
    },
  };
}

const cleanup: (() => void | Promise<void>)[] = [];
afterEach(async () => {
  for (const dispose of cleanup.splice(0).reverse()) await dispose();
});

async function fixture() {
  const testDb = await testDatabase();
  cleanup.push(() => testDb.cleanup());
  let history = [signature('old', startTime - 1)];
  let unavailable = new Set<string>();
  let logs: string[] | undefined;
  let offline = false;
  let missingTree = false;
  let treeOwner: string = TREETINO_PROGRAM_ID;
  const requests: { method: string; params: unknown[] }[] = [];
  const server = Bun.serve({
    port: 0,
    async fetch(request) {
      const {
        id,
        method,
        params = [],
      } = (await request.json()) as {
        id: number;
        method: string;
        params: unknown[];
      };
      requests.push({ method, params });
      if (offline) return new Response('offline', { status: 503 });
      let result: unknown;
      if (method === 'getGenesisHash') result = 'test-chain';
      else if (method === 'getSignaturesForAddress') {
        const { before, commitment } = params[1] as {
          before?: string;
          commitment: string;
        };
        expect(params[0]).toBe(TREETINO_PROGRAM_ID);
        expect(commitment).toBe('confirmed');
        const offset = before
          ? history.findIndex((entry) => entry.signature === before) + 1
          : 0;
        // Small server pages force actual multi-page traversal.
        result = history.slice(offset, offset + 2);
      } else if (method === 'getTransaction') {
        expect(params[1]).toMatchObject({
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0,
        });
        result = unavailable.has(params[0] as string)
          ? null
          : transaction(logs);
      } else if (method === 'getAccountInfo') {
        expect(params[0]).toBe(treeAddress.toBase58());
        expect(params[1]).toMatchObject({
          commitment: 'confirmed',
          minContextSlot: 100,
        });
        result = {
          context: { slot: 100 },
          value: missingTree
            ? null
            : {
                data: [treeAccount.toString('base64'), 'base64'],
                owner: treeOwner,
                executable: false,
                lamports: 10000,
                rentEpoch: 0,
              },
        };
      } else if (method === 'getBlockTime') result = startTime;
      else
        return Response.json({
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: 'Unexpected method' },
        });
      return Response.json({ jsonrpc: '2.0', id, result });
    },
  });
  cleanup.push(() => {
    server.stop(true);
  });
  const config = {
    ...new IndexerConfig(),
    enabled: true,
    startTime,
    rpcUrl: `http://127.0.0.1:${server.port}`,
    pollIntervalMs: 20,
  };
  const database = await DatabaseService.create(testDb.config);
  const repository = new IndexerRepository(database);
  cleanup.push(() => database.onApplicationShutdown());
  const worker = new IndexerService(
    config,
    repository,
    new SolanaRpcService(config),
    new SchedulerRegistry(),
  );
  cleanup.push(() => worker.beforeApplicationShutdown());
  return {
    config,
    testDb,
    repository,
    database,
    worker,
    requests,
    setHistory: (entries: ReturnType<typeof signature>[]) => {
      history = entries;
    },
    setUnavailable: (ids: string[]) => {
      unavailable = new Set(ids);
    },
    setLogs: (values: string[]) => {
      logs = values;
    },
    setOffline: () => {
      offline = true;
    },
    setMissingTree: (value: boolean) => {
      missingTree = value;
    },
    setTreeOwner: (value: string) => {
      treeOwner = value;
    },
  };
}

describe('Solana polling worker with real RPC decoding and PostgreSQL', () => {
  test('discovers trees, serves their purchase accounts publicly, and updates funding without duplicates', async () => {
    const f = await fixture();
    f.setHistory([signature('init')]);
    f.setLogs(treeLogs());
    const previous = {
      enabled: process.env.INDEXER_ENABLED,
      rpc: process.env.SOLANA_RPC_URL,
      path: process.env.DATABASE_URL,
    };
    process.env.INDEXER_ENABLED = 'false';
    process.env.SOLANA_RPC_URL = f.config.rpcUrl;
    process.env.DATABASE_URL = f.testDb.config.url;
    let app: Awaited<ReturnType<typeof createApplication>>;
    try {
      app = await createApplication({ logger: false });
    } finally {
      for (const [key, value] of [
        ['INDEXER_ENABLED', previous.enabled],
        ['SOLANA_RPC_URL', previous.rpc],
        ['DATABASE_URL', previous.path],
      ] as const) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
    cleanup.push(() => app.close());
    await app.listen(0, '127.0.0.1');
    const url = await app.getUrl();
    const worker = app.get(IndexerService);
    await worker.poll();
    const response = await fetch(url + '/api/trees?phase=funding');
    expect(response.status).toBe(200);
    const initial = await response.json();
    expect(initial.total).toBe(1);
    expect(initial.trees[0]).toMatchObject({
      address: treeAddress.toBase58(),
      treeId: '18446744073709551615',
      target: '18446744073709551615',
      raised: '0',
      remaining: '18446744073709551615',
      phase: 'funding',
      canBuy: true,
      shareMint: shareMint.toBase58(),
      signature: 'init',
    });
    expect(initial.trees[0].id).toMatch(/^[0-9a-f-]{36}$/);
    expect(initial.trees[0].fundingTokenAccount).toBe(
      PublicKey.findProgramAddressSync(
        [Buffer.from('funding'), treeAddress.toBuffer()],
        programId,
      )[0].toBase58(),
    );
    f.setHistory([signature('buy', startTime + 1), signature('init')]);
    f.setLogs(treeLogs('42'));
    await worker.poll();
    expect((await worker.listTrees(undefined, 100, 0)).trees[0]).toMatchObject({
      id: initial.trees[0].id,
      raised: '42',
      remaining: '18446744073709551573',
      canBuy: true,
    });
    f.setHistory([
      signature('full', startTime + 2),
      signature('buy', startTime + 1),
      signature('init'),
    ]);
    f.setLogs(treeLogs('18446744073709551615', 'Funded'));
    await worker.poll();
    expect(
      await (await fetch(url + '/api/trees?phase=funding')).json(),
    ).toEqual({ trees: [], total: 0 });
    expect((await worker.listTrees(undefined, 100, 0)).trees[0]).toMatchObject({
      id: initial.trees[0].id,
      phase: 'funded',
      remaining: '0',
      canBuy: false,
    });
    expect(await worker.listTrees(undefined, 1, 1)).toEqual({
      trees: [],
      total: 1,
    });
    for (const query of [
      'phase=wrong',
      'limit=0',
      'offset=-1',
      'limit=1001',
      'offset=1.5',
    ]) {
      expect((await fetch(url + '/api/trees?' + query)).status).toBe(400);
    }
    f.setOffline();
    expect((await (await fetch(url + '/api/trees')).json()).trees).toHaveLength(
      1,
    );
  });

  test('unavailable or foreign tree accounts block the cursor and retry atomically', async () => {
    const f = await fixture();
    f.setHistory([signature('init')]);
    f.setLogs(treeLogs());
    f.setMissingTree(true);
    await f.worker.poll();
    expect(await f.worker.getStatus()).toMatchObject({
      cursor: null,
      transactions: 0,
      events: 0,
    });
    expect((await f.worker.getStatus()).lastError).toContain(
      'Tree account unavailable',
    );
    f.setMissingTree(false);
    f.setTreeOwner(PublicKey.default.toBase58());
    await f.worker.poll();
    expect((await f.worker.getStatus()).lastError).toContain(
      'Invalid tree account owner',
    );
    f.setTreeOwner(TREETINO_PROGRAM_ID);
    await f.worker.poll();
    expect(await f.worker.getStatus()).toMatchObject({
      cursor: 'init',
      transactions: 1,
      events: 1,
      lastError: null,
    });
    expect((await f.worker.listTrees(undefined, 100, 0)).total).toBe(1);
  });

  test('backfills only today, paginates, persists exact amounts, and resumes without refetching', async () => {
    const f = await fixture();
    f.setHistory([
      signature('c', startTime + 3),
      signature('failed', startTime + 2, {
        InstructionError: [0, { Custom: 1 }],
      }),
      signature('b', startTime + 1),
      signature('a'),
      signature('old', startTime - 1),
    ]);
    await f.worker.poll();
    expect(await f.worker.getStatus()).toMatchObject({
      cursor: 'c',
      transactions: 4,
      events: 3,
      lastError: null,
    });
    expect(
      f.requests.filter((r) => r.method === 'getSignaturesForAddress'),
    ).toHaveLength(3);
    expect(
      f.requests
        .filter((r) => r.method === 'getTransaction')
        .map((r) => r.params[0]),
    ).toEqual(['a', 'b', 'c']);
    const events = (await f.worker.listEvents(0, 100)).events;
    expect(events.map((e) => e.signature)).toEqual(['a', 'b', 'c']);
    expect(events[0].data).toEqual({
      tree: TREETINO_PROGRAM_ID,
      report: PublicKey.default.toBase58(),
      amount: '18446744073709551615',
    });
    expect(
      (await f.worker.listEvents(events[0].sequence, 1)).events[0].signature,
    ).toBe('b');
    f.requests.length = 0;
    await f.worker.poll();
    expect(
      f.requests.filter((r) => r.method === 'getTransaction'),
    ).toHaveLength(0);
    f.setHistory([
      signature('e', startTime + 5),
      signature('d', startTime + 4),
      signature('c', startTime + 3),
    ]);
    await f.worker.poll();
    expect(await f.worker.getStatus()).toMatchObject({
      cursor: 'e',
      transactions: 6,
      events: 5,
    });
  });

  test('reconnecting PostgreSQL restores history and cursor even if the RPC is offline', async () => {
    const f = await fixture();
    f.setHistory([signature('a'), signature('old', startTime - 1)]);
    f.setLogs(treeLogs());
    await f.worker.poll();
    const savedTree = (await f.worker.listTrees(undefined, 100, 0)).trees[0];
    await f.worker.beforeApplicationShutdown();
    await f.database.onApplicationShutdown();
    const reopened = await DatabaseService.create(f.testDb.config);
    cleanup.push(() => reopened.onApplicationShutdown());
    const resumed = new IndexerService(
      { ...f.config, startTime: startTime + 86400 },
      new IndexerRepository(reopened),
      new SolanaRpcService(f.config),
      new SchedulerRegistry(),
    );
    cleanup.push(() => resumed.beforeApplicationShutdown());
    await resumed.onModuleInit();
    expect(await resumed.getStatus()).toMatchObject({
      cursor: 'a',
      events: 1,
      startAt: '2026-10-04T00:00:00.000Z',
    });
    f.setOffline();
    await resumed.poll();
    expect((await resumed.getStatus()).lastError).not.toBeNull();
    expect((await resumed.listEvents(0, 100)).events).toHaveLength(1);
    expect((await resumed.listTrees(undefined, 100, 0)).trees).toEqual([
      savedTree,
    ]);
    expect((await resumed.getStatus()).cursor).toBe('a');
  });

  test('missing transaction blocks progress and retries without duplicates', async () => {
    const f = await fixture();
    f.setHistory([
      signature('c', startTime + 2),
      signature('b', startTime + 1),
      signature('a'),
    ]);
    f.setUnavailable(['b']);
    await f.worker.poll();
    expect(await f.worker.getStatus()).toMatchObject({
      cursor: 'a',
      events: 1,
      lastError: 'Transaction unavailable: b',
    });
    f.setUnavailable([]);
    await f.worker.poll();
    expect(await f.worker.getStatus()).toMatchObject({
      cursor: 'c',
      events: 3,
      lastError: null,
    });
  });

  test('missing saved cursor reports a history gap without advancing', async () => {
    const f = await fixture();
    f.setHistory([signature('a')]);
    await f.worker.poll();
    f.setHistory([signature('b', startTime + 1)]);
    await f.worker.poll();
    expect((await f.worker.getStatus()).lastError).toContain('RPC history gap');
    expect(await f.worker.getStatus()).toMatchObject({
      cursor: 'a',
      transactions: 1,
    });
  });

  test('truncated and undecodable event data block the cursor', async () => {
    const f = await fixture();
    f.setHistory([signature('a')]);
    f.setLogs([`Program ${TREETINO_PROGRAM_ID} invoke [1]`, 'Log truncated']);
    await f.worker.poll();
    expect(await f.worker.getStatus()).toMatchObject({
      cursor: null,
      events: 0,
      lastError: 'Missing or truncated logs: a',
    });
    f.setLogs([
      `Program ${TREETINO_PROGRAM_ID} invoke [1]`,
      'Program data: AAAAAAAAAAA=',
      `Program ${TREETINO_PROGRAM_ID} success`,
    ]);
    await f.worker.poll();
    expect((await f.worker.getStatus()).lastError).toContain(
      'Unable to decode event',
    );
    expect((await f.worker.getStatus()).cursor).toBeNull();
  });

  test('ignores events from other programs and handles multiple invocations', async () => {
    const f = await fixture();
    f.setHistory([signature('a')]);
    f.setLogs([
      `Program ${TREETINO_PROGRAM_ID} invoke [1]`,
      `Program data: ${data}`,
      `Program ${PublicKey.default} invoke [2]`,
      `Program data: ${data}`,
      `Program ${PublicKey.default} success`,
      `Program ${TREETINO_PROGRAM_ID} success`,
      `Program ${TREETINO_PROGRAM_ID} invoke [1]`,
      `Program data: ${data}`,
      `Program ${TREETINO_PROGRAM_ID} success`,
    ]);
    await f.worker.poll();
    expect(await f.worker.getStatus()).toMatchObject({
      events: 2,
      lastError: null,
    });
    expect(
      (await f.worker.listEvents(0, 100)).events.map((e) => e.eventIndex),
    ).toEqual([0, 1]);
  });

  test('coalesces overlapping polls and registers and cleans up the scheduled job', async () => {
    const f = await fixture();
    const first = f.worker.poll();
    expect(f.worker.poll()).toBe(first);
    await first;
    f.requests.length = 0;
    f.worker.onApplicationBootstrap();
    const deadline = Date.now() + 2000;
    while (
      f.requests.filter((r) => r.method === 'getGenesisHash').length < 2 &&
      Date.now() < deadline
    ) {
      await Bun.sleep(10);
    }
    expect(
      f.requests.filter((r) => r.method === 'getGenesisHash').length,
    ).toBeGreaterThanOrEqual(2);
    await f.worker.beforeApplicationShutdown();
    expect((await f.worker.getStatus()).running).toBe(false);
    const count = f.requests.length;
    await Bun.sleep(50);
    expect(f.requests).toHaveLength(count);
  });

  for (const table of ['indexed_events', 'indexed_trees']) {
    test(`${table} insertion failure rolls back history, trees, and cursor together`, async () => {
      const f = await fixture();
      await f.repository.initialize(
        stream,
        startTime,
        f.config.rpcUrl,
        TREETINO_PROGRAM_ID,
      );
      await f.testDb.sql.unsafe(
        `CREATE FUNCTION reject_write() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test write failure'; END; $$`,
      );
      await f.testDb.sql.unsafe(
        `CREATE TRIGGER reject_write BEFORE INSERT ON ${table} FOR EACH ROW EXECUTE FUNCTION reject_write()`,
      );
      const tree = decodeTree(
        treeAddress.toBase58(),
        { phase: { Funding: {} }, raised: '0' },
        {
          data: treeAccount,
          owner: programId,
          executable: false,
          lamports: 10000,
        },
      );
      await expect(
        f.repository.saveTransaction(
          stream,
          'init',
          100,
          startTime,
          null,
          transaction(treeLogs()),
          [
            {
              name: 'TreeChanged',
              data: { tree: tree.address, phase: { Funding: {} }, raised: '0' },
            },
          ],
          [tree],
        ),
      ).rejects.toThrow();
      expect(await f.repository.counts(stream)).toEqual({
        transactions: 0,
        events: 0,
      });
      expect(await f.repository.listTrees(stream, undefined, 100, 0)).toEqual({
        trees: [],
        total: 0,
      });
      expect(
        (await f.repository.getSavedState(
          f.config.rpcUrl,
          TREETINO_PROGRAM_ID,
        ))!.cursor,
      ).toBeNull();
    });
  }
});
