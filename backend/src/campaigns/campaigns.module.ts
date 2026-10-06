import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { IndexerModule } from '../indexer/indexer.module';
import { CampaignsRepository } from './campaigns.repository';
import { CampaignsService } from './campaigns.service';
import { CampaignsController } from './campaigns.controller';

@Module({
  imports: [DatabaseModule, AuthModule, IndexerModule],
  providers: [CampaignsRepository, CampaignsService],
  controllers: [CampaignsController],
  exports: [CampaignsService],
})
export class CampaignsModule {}
