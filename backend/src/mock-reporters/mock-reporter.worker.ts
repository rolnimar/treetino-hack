import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type BeforeApplicationShutdown,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { IndexerConfig } from '../indexer/indexer.config';
import { MockReporterService } from './mock-reporter.service';

@Injectable()
export class MockReporterWorker
  implements OnApplicationBootstrap, BeforeApplicationShutdown
{
  private readonly logger = new Logger(MockReporterWorker.name);
  private inFlight: Promise<void> | null = null;
  private stopping = false;
  readonly enabled: boolean;
  readonly pollMs: number;
  constructor(
    private readonly reporter: MockReporterService,
    private readonly scheduler: SchedulerRegistry,
    config: IndexerConfig,
  ) {
    const enabled = process.env.MOCK_REPORTER_ENABLED ?? String(config.enabled);
    if (!['true', 'false'].includes(enabled))
      throw new Error('MOCK_REPORTER_ENABLED must be true or false');
    this.enabled = enabled === 'true';
    const seconds = Number(process.env.MOCK_REPORTER_POLL_SECONDS ?? 60);
    if (!Number.isSafeInteger(seconds) || seconds < 1 || seconds > 86400)
      throw new Error('MOCK_REPORTER_POLL_SECONDS must be from 1 to 86400');
    this.pollMs = seconds * 1000;
  }
  onApplicationBootstrap() {
    if (!this.enabled) return;
    this.scheduler.addInterval(
      'mock-tree-reports',
      setInterval(() => void this.poll(), this.pollMs),
    );
    void this.poll();
  }
  poll(): Promise<void> {
    if (this.stopping) return Promise.resolve();
    if (this.inFlight) return this.inFlight;
    this.inFlight = this.reporter
      .run()
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
  async beforeApplicationShutdown() {
    this.stopping = true;
    if (this.scheduler.doesExist('interval', 'mock-tree-reports'))
      this.scheduler.deleteInterval('mock-tree-reports');
    await this.inFlight;
  }
}
