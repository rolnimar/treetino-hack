import {
  foreignKey,
  index,
  integer,
  pgTable,
  uuid,
  jsonb,
  bigint,
  bigserial,
  text,
  uniqueIndex,
  unique,
} from 'drizzle-orm/pg-core';
import type { TreePhase } from '@treetino/contracts';

const uuidPrimaryKey = () => uuid('id').primaryKey().defaultRandom();

export const indexerState = pgTable(
  'indexer_state',
  {
    id: uuidPrimaryKey(),
    stream: text('stream').notNull(),
    startTime: bigint('start_time', { mode: 'number' }).notNull(),
    cursor: text('cursor'),
  },
  (table) => [unique('indexer_state_stream').on(table.stream)],
);

export const indexerSources = pgTable(
  'indexer_sources',
  {
    id: uuidPrimaryKey(),
    rpcUrl: text('rpc_url').notNull(),
    programId: text('program_id').notNull(),
    stream: text('stream')
      .notNull()
      .references(() => indexerState.stream),
  },
  (table) => [
    uniqueIndex('indexer_sources_rpc_program').on(
      table.rpcUrl,
      table.programId,
    ),
  ],
);

export const indexedTransactions = pgTable(
  'indexed_transactions',
  {
    id: uuidPrimaryKey(),
    stream: text('stream')
      .notNull()
      .references(() => indexerState.stream),
    signature: text('signature').notNull(),
    slot: bigint('slot', { mode: 'number' }).notNull(),
    blockTime: bigint('block_time', { mode: 'number' }).notNull(),
    error: jsonb('error_json').$type<unknown>(),
    transaction: jsonb('transaction_json').$type<unknown>(),
  },
  (table) => [
    unique('indexed_transactions_stream_signature').on(
      table.stream,
      table.signature,
    ),
  ],
);

export const indexedEvents = pgTable(
  'indexed_events',
  {
    id: uuidPrimaryKey(),
    sequence: bigserial('sequence', { mode: 'number' }).notNull(),
    stream: text('stream').notNull(),
    signature: text('signature').notNull(),
    eventIndex: integer('event_index').notNull(),
    name: text('name').notNull(),
    data: jsonb('data_json').$type<unknown>().notNull(),
  },
  (table) => [
    uniqueIndex('indexed_events_transaction_event').on(
      table.stream,
      table.signature,
      table.eventIndex,
    ),
    uniqueIndex('indexed_events_sequence').on(table.sequence),
    index('indexed_events_stream_sequence').on(table.stream, table.sequence),
    foreignKey({
      columns: [table.stream, table.signature],
      foreignColumns: [
        indexedTransactions.stream,
        indexedTransactions.signature,
      ],
    }),
  ],
);

export type IndexerState = typeof indexerState.$inferSelect;

export const indexedTrees = pgTable(
  'indexed_trees',
  {
    id: uuidPrimaryKey(),
    stream: text('stream')
      .notNull()
      .references(() => indexerState.stream),
    address: text('address').notNull(),
    treeId: text('tree_id').notNull(),
    creator: text('creator').notNull(),
    supplier: text('supplier').notNull(),
    client: text('client').notNull(),
    reporter: text('reporter').notNull(),
    paymentMint: text('payment_mint').notNull(),
    shareMint: text('share_mint').notNull(),
    fundingTokenAccount: text('funding_token_account').notNull(),
    target: text('target').notNull(),
    raised: text('raised').notNull(),
    phase: text('phase').$type<TreePhase>().notNull(),
    maxIntervalWh: integer('max_interval_wh').notNull(),
    blockTime: bigint('block_time', { mode: 'number' }).notNull(),
    signature: text('signature').notNull(),
  },
  (table) => [
    uniqueIndex('indexed_trees_stream_address').on(table.stream, table.address),
    index('indexed_trees_stream_phase').on(table.stream, table.phase),
  ],
);

export type IndexedTreeInput = Omit<
  typeof indexedTrees.$inferInsert,
  'id' | 'stream' | 'blockTime' | 'signature'
>;

export const admins = pgTable('admins', {
  id: uuidPrimaryKey(),
  wallet: text('wallet').notNull().unique(),
});

export const authChallenges = pgTable(
  'auth_challenges',
  {
    id: uuidPrimaryKey(),
    wallet: text('wallet').notNull(),
    message: text('message').notNull(),
    expiresAt: bigint('expires_at', { mode: 'number' }).notNull(),
  },
  (table) => [index('auth_challenges_expiry').on(table.expiresAt)],
);
