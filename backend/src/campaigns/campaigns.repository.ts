import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import {
  campaigns,
  type Campaign,
  type CampaignInput,
} from '../database/schema';

@Injectable()
export class CampaignsRepository {
  constructor(private readonly database: DatabaseService) {}

  async listAll(): Promise<Campaign[]> {
    return this.database.db.select().from(campaigns);
  }

  async findByTreeAddress(treeAddress: string): Promise<Campaign | null> {
    const [campaign] = await this.database.db
      .select()
      .from(campaigns)
      .where(eq(campaigns.treeAddress, treeAddress))
      .limit(1);
    return campaign ?? null;
  }

  async findByVictronSiteId(siteId: number): Promise<Campaign | null> {
    const [campaign] = await this.database.db
      .select()
      .from(campaigns)
      .where(eq(campaigns.victronSiteId, siteId))
      .limit(1);
    return campaign ?? null;
  }

  async upsert(input: CampaignInput): Promise<Campaign> {
    const [row] = await this.database.db
      .insert(campaigns)
      .values(input)
      .onConflictDoUpdate({
        target: [campaigns.treeAddress],
        set: {
          title: input.title,
          subtitle: input.subtitle,
          category: input.category,
          categoryBadge: input.categoryBadge,
          narrative: input.narrative,
          story: input.story,
          investorHighlight: input.investorHighlight,
          victronSiteId: input.victronSiteId,
          city: input.city,
          country: input.country,
          projectedApy: input.projectedApy,
          tariffRate: input.tariffRate,
          offTakerName: input.offTakerName,
          offTakerDescription: input.offTakerDescription,
          supplierName: input.supplierName,
          targetUsdc: input.targetUsdc,
          updatedAt: input.updatedAt,
        },
      })
      .returning();
    return row!;
  }
}
