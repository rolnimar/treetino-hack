import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { IndexerConfig } from './indexer.config';
import { IndexerController } from './indexer.controller';
import { IndexerService } from './indexer.service';
import { IndexerRepository } from './indexer.repository';
import { SolanaRpcService } from './solana-rpc.service';
import { TreesController } from './trees.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [IndexerController, TreesController],
  providers: [
    IndexerConfig,
    IndexerRepository,
    SolanaRpcService,
    IndexerService,
  ],
  exports: [IndexerService],
})
export class IndexerModule {}
