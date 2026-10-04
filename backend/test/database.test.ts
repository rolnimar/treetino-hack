import 'reflect-metadata';
import { afterEach, describe, expect, test } from 'bun:test';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { DatabaseService } from '../dist/database/database.service.js';
import { IndexerRepository } from '../dist/indexer/indexer.repository.js';
import { testDatabase } from './database.fixture';

const cleanup: (() => void | Promise<void>)[] = [];
afterEach(async () => {
  for (const dispose of cleanup.splice(0).reverse()) await dispose();
});

async function fixture() {
  const db = await testDatabase();
  cleanup.push(() => db.cleanup());
  return db;
}

describe('automatic PostgreSQL migrations', () => {
  test('concurrent fresh startup applies one migration and preserves UUID records on restart', async () => {
    const { config, sql } = await fixture();
    const [first, other] = await Promise.all([
      DatabaseService.create(config),
      DatabaseService.create(config),
    ]);
    cleanup.push(
      () => first.onApplicationShutdown(),
      () => other.onApplicationShutdown(),
    );
    const repository = new IndexerRepository(first);
    await repository.initialize(
      'chain:program',
      123,
      'https://rpc.test',
      'program',
    );
    await repository.saveTransaction(
      'chain:program',
      'signature',
      1,
      123,
      null,
      { meta: {} },
      [{ name: 'InvoicePaid', data: { amount: '42' } }],
      [
        {
          address: 'tree-address',
          treeId: '1',
          creator: 'creator',
          supplier: 'supplier',
          client: 'client',
          reporter: 'reporter',
          paymentMint: 'payment-mint',
          shareMint: 'share-mint',
          fundingTokenAccount: 'funding-account',
          target: '100',
          raised: '42',
          phase: 'funding',
          maxIntervalWh: 1000,
        },
      ],
    );
    await first.onApplicationShutdown();
    const second = await DatabaseService.create(config);
    cleanup.push(() => second.onApplicationShutdown());
    const resumed = new IndexerRepository(second);
    expect(
      await resumed.getSavedState('https://rpc.test', 'program'),
    ).toMatchObject({
      stream: 'chain:program',
      startTime: 123,
      cursor: 'signature',
    });
    expect((await resumed.listEvents('chain:program', 0, 10))[0].data).toEqual({
      amount: '42',
    });
    expect(
      (await resumed.listTrees('chain:program', undefined, 10, 0)).trees[0],
    ).toMatchObject({ address: 'tree-address', remaining: '58', canBuy: true });
    for (const table of [
      'indexer_state',
      'indexer_sources',
      'indexed_transactions',
      'indexed_events',
      'indexed_trees',
    ]) {
      const columns =
        await sql`SELECT c.column_name, c.data_type FROM information_schema.table_constraints t JOIN information_schema.key_column_usage k USING (constraint_catalog, constraint_schema, constraint_name) JOIN information_schema.columns c ON c.table_schema = k.table_schema AND c.table_name = k.table_name AND c.column_name = k.column_name WHERE t.constraint_type = 'PRIMARY KEY' AND t.table_schema = 'public' AND t.table_name = ${table}`;
      expect([...columns]).toEqual([{ column_name: 'id', data_type: 'uuid' }]);
      const rows = await sql.unsafe(`SELECT id FROM "${table}"`);
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows)
        expect(row.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
        );
    }
    const [{ count }] =
      await sql`SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations`;
    expect(count).toBe(1);
  });

  test('applies later migrations automatically and rolls back a failing migration', async () => {
    const { config, sql } = await fixture();
    const directory = mkdtempSync(join(tmpdir(), 'treetino-migrations-'));
    cleanup.push(() => rmSync(directory, { recursive: true, force: true }));
    const migrationsFolder = join(directory, 'migrations');
    mkdirSync(join(migrationsFolder, 'meta'), { recursive: true });
    const journal = JSON.parse(
      readFileSync(join(config.migrationsFolder, 'meta/_journal.json'), 'utf8'),
    );
    const lastEntry = journal.entries.at(-1);
    for (const entry of journal.entries)
      writeFileSync(
        join(migrationsFolder, entry.tag + '.sql'),
        readFileSync(join(config.migrationsFolder, entry.tag + '.sql')),
      );
    const saveJournal = () =>
      writeFileSync(
        join(migrationsFolder, 'meta/_journal.json'),
        JSON.stringify(journal),
      );
    saveJournal();
    const temporaryConfig = { ...config, migrationsFolder };
    const first = await DatabaseService.create(temporaryConfig);
    await first.onApplicationShutdown();
    journal.entries.push({
      idx: 1,
      version: '7',
      when: lastEntry.when + 1,
      tag: '0001_test_upgrade',
      breakpoints: true,
    });
    writeFileSync(
      join(migrationsFolder, '0001_test_upgrade.sql'),
      'ALTER TABLE indexer_state ADD COLUMN test_upgrade TEXT;',
    );
    saveJournal();
    const second = await DatabaseService.create(temporaryConfig);
    await second.onApplicationShutdown();
    journal.entries.push({
      idx: 2,
      version: '7',
      when: lastEntry.when + 2,
      tag: '0002_test_failure',
      breakpoints: true,
    });
    writeFileSync(
      join(migrationsFolder, '0002_test_failure.sql'),
      'CREATE TABLE should_rollback (id UUID);\n--> statement-breakpoint\nINVALID SQL;',
    );
    saveJournal();
    await expect(DatabaseService.create(temporaryConfig)).rejects.toThrow();
    const columns =
      await sql`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'indexer_state'`;
    expect(columns.map((c) => c.column_name)).toContain('test_upgrade');
    const [{ count }] =
      await sql`SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations`;
    expect(count).toBe(2);
    const [{ table_name }] =
      await sql`SELECT to_regclass('public.should_rollback')::text AS table_name`;
    expect(table_name).toBeNull();
  });

  test('missing migration assets fail startup', async () => {
    const { config } = await fixture();
    await expect(
      DatabaseService.create({
        ...config,
        migrationsFolder: '/missing/treetino/migrations',
      }),
    ).rejects.toThrow();
  });
});
