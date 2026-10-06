import { Injectable } from '@nestjs/common';
import { and, count, eq, gt, desc, inArray, isNull, sql } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import {
  indexedEvents,
  indexedTrees,
  indexedReports,
  indexedTransactions,
  indexerSources,
  indexerState,
  type IndexerState,
  type IndexedTreeInput,
  type IndexedReportInput,
} from '../database/schema';
import type {
  TreeInfo,
  TreePhase,
  TreesResponse,
  TreeReportsResponse,
} from '@treetino/contracts';

export interface IndexedEvent {
  name: string;
  data: unknown;
}

@Injectable()
export class IndexerRepository {
  constructor(private readonly database: DatabaseService) {}

  async initialize(
    stream: string,
    startTime: number,
    rpcUrl: string,
    programId: string,
  ): Promise<IndexerState> {
    return this.database.db.transaction(async (tx) => {
      await tx
        .insert(indexerState)
        .values({ stream, startTime })
        .onConflictDoNothing();
      await tx
        .insert(indexerSources)
        .values({ rpcUrl, programId, stream })
        .onConflictDoUpdate({
          target: [indexerSources.rpcUrl, indexerSources.programId],
          set: { stream },
        });
      const [state] = await tx
        .select()
        .from(indexerState)
        .where(eq(indexerState.stream, stream));
      return state!;
    });
  }

  async getSavedState(rpcUrl: string, programId: string) {
    const [state] = await this.database.db
      .select({
        id: indexerState.id,
        stream: indexerState.stream,
        startTime: indexerState.startTime,
        cursor: indexerState.cursor,
      })
      .from(indexerState)
      .innerJoin(indexerSources, eq(indexerSources.stream, indexerState.stream))
      .where(
        and(
          eq(indexerSources.rpcUrl, rpcUrl),
          eq(indexerSources.programId, programId),
        ),
      )
      .limit(1);
    return state ?? null;
  }

  async saveTransaction(
    stream: string,
    signature: string,
    slot: number,
    blockTime: number,
    error: unknown,
    transaction: unknown,
    events: IndexedEvent[],
    trees: IndexedTreeInput[] = [],
    reports: IndexedReportInput[] = [],
  ) {
    await this.database.db.transaction(async (tx) => {
      await tx
        .insert(indexedTransactions)
        .values({
          stream,
          signature,
          slot,
          blockTime,
          error: error ?? null,
          transaction: transaction ?? null,
        })
        .onConflictDoNothing({
          target: [indexedTransactions.stream, indexedTransactions.signature],
        });
      for (const [eventIndex, event] of events.entries()) {
        await tx
          .insert(indexedEvents)
          .values({
            stream,
            signature,
            eventIndex,
            ...event,
          })
          .onConflictDoNothing({
            target: [
              indexedEvents.stream,
              indexedEvents.signature,
              indexedEvents.eventIndex,
            ],
          });
      }
      for (const tree of trees) {
        const values = { ...tree, stream, signature, blockTime };
        await tx
          .insert(indexedTrees)
          .values(values)
          .onConflictDoUpdate({
            target: [indexedTrees.stream, indexedTrees.address],
            set: values,
          });
      }
      for (const report of reports)
        await this.saveReport(tx, stream, signature, blockTime, report);
      await tx
        .update(indexerState)
        .set({ cursor: signature })
        .where(eq(indexerState.stream, stream));
    });
  }

  private async saveReport(
    db: Pick<DatabaseService['db'], 'insert'>,
    stream: string,
    signature: string,
    blockTime: number,
    report: IndexedReportInput,
  ) {
    const values = { ...report, stream, signature, blockTime };
    await db
      .insert(indexedReports)
      .values(values)
      .onConflictDoUpdate({
        target: [indexedReports.stream, indexedReports.address],
        set: values,
      });
  }

  async saveBackfilledReport(
    stream: string,
    signature: string,
    blockTime: number,
    report: IndexedReportInput,
  ) {
    await this.saveReport(
      this.database.db,
      stream,
      signature,
      blockTime,
      report,
    );
  }

  async unprojectedReports(stream: string) {
    return this.database.db
      .select({
        data: indexedEvents.data,
        signature: indexedEvents.signature,
        blockTime: indexedTransactions.blockTime,
        slot: indexedTransactions.slot,
      })
      .from(indexedEvents)
      .innerJoin(
        indexedTransactions,
        and(
          eq(indexedTransactions.stream, indexedEvents.stream),
          eq(indexedTransactions.signature, indexedEvents.signature),
        ),
      )
      .leftJoin(
        indexedReports,
        and(
          eq(indexedReports.stream, indexedEvents.stream),
          eq(indexedReports.address, sql`${indexedEvents.data}->>'report'`),
        ),
      )
      .where(
        and(
          eq(indexedEvents.stream, stream),
          inArray(indexedEvents.name, [
            'ProductionReported',
            'InvoiceIssued',
            'InvoicePaid',
          ]),
          isNull(indexedReports.id),
        ),
      )
      .orderBy(desc(indexedEvents.sequence))
      .limit(100);
  }

  async listReports(
    stream: string,
    tree: string,
    limit: number,
    offset: number,
  ): Promise<TreeReportsResponse> {
    const filter = and(
      eq(indexedReports.stream, stream),
      eq(indexedReports.tree, tree),
    );
    const rows = await this.database.db
      .select()
      .from(indexedReports)
      .where(filter)
      .orderBy(desc(sql`${indexedReports.dayStartTs}::bigint`))
      .limit(limit)
      .offset(offset);
    const [result] = await this.database.db
      .select({ count: count() })
      .from(indexedReports)
      .where(filter);
    return {
      reports: rows.map(({ stream: _stream, blockTime, ...report }) => ({
        ...report,
        updatedAt: new Date(blockTime * 1000).toISOString(),
      })),
      total: result!.count,
    };
  }

  async listTrees(
    stream: string,
    phase: TreePhase | undefined,
    limit: number,
    offset: number,
    client?: string,
  ): Promise<TreesResponse> {
    const filter = and(
      eq(indexedTrees.stream, stream),
      phase ? eq(indexedTrees.phase, phase) : undefined,
      client ? eq(indexedTrees.client, client) : undefined,
    );
    const rows = await this.database.db
      .select()
      .from(indexedTrees)
      .where(filter)
      .orderBy(indexedTrees.address)
      .limit(limit)
      .offset(offset);
    const trees: TreeInfo[] = rows.map(
      ({ stream: _stream, blockTime, ...tree }) => {
        const remaining = BigInt(tree.target) - BigInt(tree.raised);
        return {
          ...tree,
          remaining: remaining.toString(),
          canBuy: tree.phase === 'funding' && remaining > 0n,
          updatedAt: new Date(blockTime * 1000).toISOString(),
        };
      },
    );
    const [result] = await this.database.db
      .select({ count: count() })
      .from(indexedTrees)
      .where(filter);
    return { trees, total: result!.count };
  }

  async ownsClientTree(stream: string, address: string, wallet: string) {
    const [tree] = await this.database.db
      .select({ id: indexedTrees.id })
      .from(indexedTrees)
      .where(
        and(
          eq(indexedTrees.stream, stream),
          eq(indexedTrees.address, address),
          eq(indexedTrees.client, wallet),
        ),
      )
      .limit(1);
    return !!tree;
  }

  async listEvents(stream: string, after: number, limit: number) {
    return this.database.db
      .select({
        id: indexedEvents.id,
        sequence: indexedEvents.sequence,
        signature: indexedEvents.signature,
        slot: indexedTransactions.slot,
        blockTime: indexedTransactions.blockTime,
        eventIndex: indexedEvents.eventIndex,
        name: indexedEvents.name,
        data: indexedEvents.data,
      })
      .from(indexedEvents)
      .innerJoin(
        indexedTransactions,
        and(
          eq(indexedTransactions.stream, indexedEvents.stream),
          eq(indexedTransactions.signature, indexedEvents.signature),
        ),
      )
      .where(
        and(
          eq(indexedEvents.stream, stream),
          gt(indexedEvents.sequence, after),
        ),
      )
      .orderBy(indexedEvents.sequence)
      .limit(limit);
  }

  async counts(stream: string) {
    const db = this.database.db;
    const [[transactions], [events]] = await Promise.all([
      db
        .select({ count: count() })
        .from(indexedTransactions)
        .where(eq(indexedTransactions.stream, stream)),
      db
        .select({ count: count() })
        .from(indexedEvents)
        .where(eq(indexedEvents.stream, stream)),
    ]);
    return { transactions: transactions!.count, events: events!.count };
  }
}
