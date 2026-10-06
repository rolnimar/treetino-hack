import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { IndexerConfig } from './indexer.config';
import { IndexerController } from './indexer.controller';
import { IndexerService } from './indexer.service';
import { IndexerRepository } from './indexer.repository';
import { SolanaRpcService } from './solana-rpc.service';
import { ClientTreesController } from './client-trees.controller';
import { TreesController } from './trees.controller';
import { AuthModule } from '../auth/auth.module';
import { MockReporterController } from '../mock-reporters/mock-reporter.controller';
import { MockReporterService } from '../mock-reporters/mock-reporter.service';
import { MockReporterWorker } from '../mock-reporters/mock-reporter.worker';
import { BillingService } from '../billing/billing.service';
import { SpotPriceService } from '../billing/spot-price.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [
    IndexerController,
    TreesController,
    MockReporterController,
    ClientTreesController,
  ],
  providers: [
    IndexerConfig,
    IndexerRepository,
    SolanaRpcService,
    IndexerService,
    MockReporterService,
    MockReporterWorker,
    SpotPriceService,
    BillingService,
  ],
  exports: [IndexerService],
})
export class IndexerModule {}
