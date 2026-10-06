import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type BeforeApplicationShutdown,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { and, eq, sql } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { indexedReports } from '../database/schema';
import { IndexerConfig } from '../indexer/indexer.config';
import {
  SpotPriceService,
  priceInvoice,
  pricingDates,
} from './spot-price.service';

@Injectable()
export class BillingService
  implements OnApplicationBootstrap, BeforeApplicationShutdown
{
  private readonly logger = new Logger(BillingService.name);
  private inFlight: Promise<void> | null = null;
  private stopping = false;
  constructor(
    private readonly database: DatabaseService,
    private readonly prices: SpotPriceService,
    private readonly config: IndexerConfig,
    private readonly scheduler: SchedulerRegistry,
  ) {}

  onApplicationBootstrap() {
    if (!this.config.enabled) return;
    this.scheduler.addInterval(
      'invoice-pricing',
      setInterval(() => void this.poll(), 60_000),
    );
    void this.poll();
  }
  poll(): Promise<void> {
    if (this.stopping) return Promise.resolve();
    if (this.inFlight) return this.inFlight;
    this.inFlight = this.pricePending()
      .catch((error: unknown) =>
        this.logger.error(
          error instanceof Error ? error.message : String(error),
        ),
      )
      .finally(() => {
        this.inFlight = null;
      });
    return this.inFlight;
  }
  private async pricePending() {
    // Reprice unissued legacy drafts; an already-issued chain invoice stays immutable.
    const pending = sql`(${indexedReports.pricing} is null or (${indexedReports.invoiceIssued} = false and ${indexedReports.pricing}->>'method' is distinct from 'quarter-hour'))`;
    const reports = await this.database.db
      .select()
      .from(indexedReports)
      .where(pending)
      .orderBy(sql`${indexedReports.pricingError} nulls first`)
      .limit(100);
    const quotes = new Map<
      string,
      Awaited<ReturnType<SpotPriceService['quote']>> | Error
    >();
    for (const report of reports) {
      if (this.stopping) return;
      try {
        const reportQuotes: Awaited<ReturnType<SpotPriceService['quote']>>[] =
          [];
        for (const date of pricingDates(report.dayStartTs, report.wh.length)) {
          if (!quotes.has(date)) {
            try {
              quotes.set(date, await this.prices.quote(date));
            } catch (error) {
              quotes.set(
                date,
                error instanceof Error ? error : new Error(String(error)),
              );
            }
          }
          const quote = quotes.get(date)!;
          if (quote instanceof Error) throw quote;
          reportQuotes.push(quote);
        }
        await this.database.db
          .update(indexedReports)
          .set({
            pricing: priceInvoice(report.dayStartTs, report.wh, reportQuotes),
            pricingError: null,
          })
          .where(and(eq(indexedReports.id, report.id), pending));
      } catch (error) {
        await this.database.db
          .update(indexedReports)
          .set({
            pricingError:
              error instanceof Error ? error.message : 'Spot price unavailable',
          })
          .where(and(eq(indexedReports.id, report.id), pending));
      }
    }
  }
  async beforeApplicationShutdown() {
    this.stopping = true;
    if (this.scheduler.doesExist('interval', 'invoice-pricing'))
      this.scheduler.deleteInterval('invoice-pricing');
    await this.inFlight;
  }
}
