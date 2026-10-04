import { Injectable } from '@nestjs/common';
import { and, count, eq, gt } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import {
  indexedEvents,
  indexedTrees,
  indexedTransactions,
  indexerSources,
  indexerState,
  type IndexerState,
  type IndexedTreeInput,
} from '../database/schema';
import type { TreeInfo, TreePhase, TreesResponse } from '@treetino/contracts';

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
      await tx
        .update(indexerState)
        .set({ cursor: signature })
        .where(eq(indexerState.stream, stream));
    });
  }

  async listTrees(
    stream: string,
    phase: TreePhase | undefined,
    limit: number,
    offset: number,
  ): Promise<TreesResponse> {
    const filter = and(
      eq(indexedTrees.stream, stream),
      phase ? eq(indexedTrees.phase, phase) : undefined,
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
