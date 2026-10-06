import { Injectable, Logger } from '@nestjs/common';
import { CampaignsRepository } from './campaigns.repository';
import { IndexerService } from '../indexer/indexer.service';
import type {
  CampaignDossier,
  CampaignsResponse,
  CreateCampaignDto,
} from '@treetino/contracts';

const DEFAULT_FLAGSHIP_CAMPAIGNS: CampaignDossier[] = [
  {
    id: 'demo-campaign-209689',
    treeAddress: '48e7da86e0d9_victron_offgrid',
    treeId: '1',
    title: 'Off-Grid Solar Microgrid',
    subtitle: 'Queensland Rural Clean Energy Transition',
    category: 'Off-Grid Solar',
    categoryBadge: 'Off-Grid Solar',
    narrative:
      'Community microgrid enabling permissionless clean power. Backers fund rooftop solar and lithium battery storage replacing expensive off-grid diesel generation in rural Queensland. Repayments stream continuously as solar power is consumed.',
    story:
      'In remote regional Queensland, off-grid homeowners currently rely on costly diesel gensets running at up to $0.65/kWh. By tokenizing a high-capacity Victron MultiPlus-II inverter and lithium battery bank, investors fund the upfront hardware installation. The homeowner pays an indexed $0.40/kWh microgrid tariff, generating an estimated 8.5% annual return with zero diesel emissions.',
    investorHighlight:
      'Direct consumer payback model replacing expensive off-grid diesel generators with clean solar equity.',
    victronSiteId: 209689,
    city: 'Queensland',
    country: 'Australia',
    projectedApy: '8.5%',
    tariffRate:
      '$0.40 / kWh metered consumer consumption (vs $0.65/kWh diesel baseline)',
    offTakerName: 'Queensland Rural Resident (10-Yr Agreement)',
    offTakerDescription:
      'Guaranteed microgrid PPA contract with automated Cerbo GX smart metering.',
    supplierName: 'Victron Certified Integrator Australia',
    targetUsdc: '10000',
    raisedUsdc: '7850',
    phase: 'funding',
    canBuy: true,
    createdAt: 1728000000000,
    updatedAt: 1728000000000,
  },
  {
    id: 'demo-campaign-219742',
    treeAddress: 'c0619ab27f32_victron_ess',
    treeId: '2',
    title: 'Commercial ESS Battery Storage',
    subtitle: 'Amsterdam Wholesale Power Arbitrage',
    category: 'Battery Storage (BESS)',
    categoryBadge: 'Battery Storage (BESS)',
    narrative:
      'Commercial grid-tied battery storage system (BESS). Solves renewable intermittency by charging during negative/low-cost solar hours and discharging during peak tariff windows, capturing premium grid balancing revenue.',
    story:
      'The European energy transition faces severe grid congestion and volatile pricing. This 50 kWh commercial battery system in Amsterdam automatically charges from the Dutch grid when solar oversupply causes near-zero or negative spot prices, and feeds back into the grid during evening peak demands at up to $0.35/kWh spread, alongside contracted primary frequency containment reserve (FCR) capacity payments.',
    investorHighlight:
      'High-yield infrastructure monetizing wholesale peak arbitrage spreads and national grid frequency response.',
    victronSiteId: 219742,
    city: 'Amsterdam',
    country: 'Netherlands',
    projectedApy: '14.2%',
    tariffRate:
      '$0.35 / kWh peak discharge spread + €45/MW/h grid frequency reserve',
    offTakerName: 'TenneT TSO & EPEX Spot Market',
    offTakerDescription:
      'Dual-stream monetization: algorithmic market arbitrage plus automatic frequency balancing.',
    supplierName: 'Victron B.V. Commercial Solutions',
    targetUsdc: '50000',
    raisedUsdc: '42100',
    phase: 'funding',
    canBuy: true,
    createdAt: 1728000000000,
    updatedAt: 1728000000000,
  },
  {
    id: 'demo-campaign-374891',
    treeAddress: 'par_evcs_374891_plaza',
    treeId: '3',
    title: 'Solar EV Fast-Charging Hub',
    subtitle: 'Parisian 10-Bay Commercial Mobility Plaza',
    category: 'EV Fast Charging',
    categoryBadge: 'EV Fast Charging',
    narrative:
      'Multi-bay commercial EV charging plaza buffered with solar and storage. Processes high daily energy throughput, laying the foundation for autonomous vehicle micro-billing and native energy stablecoins.',
    story:
      'Located at a high-traffic logistics hub near Paris, this installation deploys 10 high-power Victron EV Charging Stations backed by a 150 kW rooftop canopy and 200 kWh buffer storage. Retail drivers and fleet vehicles charge daily, paying $0.42/kWh plus connection fees directly into the protocol.',
    investorHighlight:
      'High-velocity recurring transaction volume directly from EV fleet operators and retail drivers.',
    victronSiteId: 374891,
    city: 'Paris',
    country: 'France',
    projectedApy: '18.5%',
    tariffRate:
      '$0.42 / kWh delivered + $2.50 session connection fee per charge',
    offTakerName: 'Commercial Fleet Operators & Retail EV Drivers',
    offTakerDescription:
      'Automated point-of-sale micro-transactions across 10 commercial charging bays.',
    supplierName: 'ElectroCharge France SAS',
    targetUsdc: '100000',
    raisedUsdc: '91500',
    phase: 'funding',
    canBuy: true,
    createdAt: 1728000000000,
    updatedAt: 1728000000000,
  },
  {
    id: 'demo-campaign-100001',
    treeAddress: 'treetino_v1_mkovo_prague',
    treeId: '4',
    title: 'Treetino V1 · Smart Energy Tree',
    subtitle: 'Biomimetic Solar + Wind Dual-Modality Microgrid',
    category: 'Biomimetic Tree',
    categoryBadge: 'Solar + Wind Tree',
    narrative:
      'Flagship 12m vertical micro-power plant combining 300 heliotropic solar leaves and 12 ducted VAWT wind turbines on a 1.2 m² footprint. Powers industrial partner MKovo s.r.o. with clean baseload power, streaming metered repayments directly to tokenholders.',
    story:
      'Traditional ground-mounted solar requires hundreds of square meters of land. Treetino V1 integrates 300 astronomical sun-tracking photovoltaic leaves with 12 ducted vertical-axis wind turbines into a sculptural 12m smart tree. Installed directly at industrial partner MKovo s.r.o. in the Czech Republic, it provides 24/7 day-and-night power for precision CNC manufacturing under a 15-year corporate PPA.',
    investorHighlight:
      'Dual-modality 45 kW generation on 1.2 m² ground footprint replacing 300 m² of rooftop solar with 24/7 day-and-night output.',
    victronSiteId: 100001,
    city: 'Prague / Středočeský',
    country: 'Czech Republic',
    projectedApy: '12.8%',
    tariffRate: '$0.32 / kWh metered corporate PPA (MKovo s.r.o.)',
    offTakerName: 'MKovo s.r.o. (Precision Manufacturing)',
    offTakerDescription:
      'Long-term corporate power purchase agreement indexed to European industrial tariffs.',
    supplierName: 'Treetino CleanTech s.r.o.',
    targetUsdc: '235000',
    raisedUsdc: '192700',
    phase: 'funding',
    canBuy: true,
    createdAt: 1728000000000,
    updatedAt: 1728000000000,
  },
];

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    private readonly repository: CampaignsRepository,
    private readonly indexer: IndexerService,
  ) {}

  async listCampaigns(): Promise<CampaignsResponse> {
    const dbCampaigns = await this.repository.listAll();
    const indexedData = await this.indexer.listTrees(undefined, 1000, 0);
    const treeMap = new Map(indexedData.trees.map((t) => [t.address, t]));

    // Start with default flagship campaigns
    const result: CampaignDossier[] = DEFAULT_FLAGSHIP_CAMPAIGNS.map((def) => {
      const matched = treeMap.get(def.treeAddress);
      if (matched) {
        return {
          ...def,
          targetUsdc: (Number(BigInt(matched.target)) / 1e6).toString(),
          raisedUsdc: (Number(BigInt(matched.raised)) / 1e6).toString(),
          phase: matched.phase,
          canBuy: matched.canBuy,
          treeId: matched.treeId,
        };
      }
      return def;
    });

    // Add or merge any DB-stored custom campaigns
    for (const c of dbCampaigns) {
      const matched = treeMap.get(c.treeAddress);
      const existingIdx = result.findIndex(
        (r) =>
          r.treeAddress === c.treeAddress ||
          (c.victronSiteId && r.victronSiteId === c.victronSiteId),
      );

      const dossier: CampaignDossier = {
        id: c.id,
        treeAddress: c.treeAddress,
        treeId: c.treeId ?? (matched ? matched.treeId : '1'),
        title: c.title,
        subtitle: c.subtitle ?? undefined,
        category: c.category,
        categoryBadge: c.categoryBadge,
        narrative: c.narrative,
        story: c.story ?? undefined,
        investorHighlight: c.investorHighlight ?? undefined,
        victronSiteId: c.victronSiteId ?? undefined,
        city: c.city,
        country: c.country,
        projectedApy: c.projectedApy,
        tariffRate: c.tariffRate,
        offTakerName: c.offTakerName,
        offTakerDescription: c.offTakerDescription ?? undefined,
        supplierName: c.supplierName ?? undefined,
        targetUsdc: matched
          ? (Number(BigInt(matched.target)) / 1e6).toString()
          : c.targetUsdc,
        raisedUsdc: matched
          ? (Number(BigInt(matched.raised)) / 1e6).toString()
          : '0',
        phase: matched?.phase ?? 'funding',
        canBuy: matched?.canBuy ?? true,
        createdAt: Number(c.createdAt),
        updatedAt: Number(c.updatedAt),
      };

      if (existingIdx >= 0) {
        result[existingIdx] = dossier;
      } else {
        result.push(dossier);
      }
    }

    return { campaigns: result, total: result.length };
  }

  async getCampaign(
    idOrAddressOrSite: string,
  ): Promise<CampaignDossier | null> {
    const list = await this.listCampaigns();
    const siteNum = parseInt(idOrAddressOrSite, 10);

    const found = list.campaigns.find(
      (c) =>
        c.id === idOrAddressOrSite ||
        c.treeAddress === idOrAddressOrSite ||
        (!isNaN(siteNum) && c.victronSiteId === siteNum),
    );

    return found ?? null;
  }

  async createCampaign(dto: CreateCampaignDto): Promise<CampaignDossier> {
    const now = Date.now();
    const row = await this.repository.upsert({
      treeAddress: dto.treeAddress,
      treeId: dto.treeId ?? null,
      title: dto.title,
      subtitle: dto.subtitle ?? null,
      category: dto.category,
      categoryBadge: dto.categoryBadge,
      narrative: dto.narrative,
      story: dto.story ?? null,
      investorHighlight: dto.investorHighlight ?? null,
      victronSiteId: dto.victronSiteId ?? null,
      city: dto.city,
      country: dto.country,
      projectedApy: dto.projectedApy,
      tariffRate: dto.tariffRate,
      offTakerName: dto.offTakerName,
      offTakerDescription: dto.offTakerDescription ?? null,
      supplierName: dto.supplierName ?? null,
      targetUsdc: dto.targetUsdc,
      createdAt: now,
      updatedAt: now,
    });

    return {
      id: row.id,
      treeAddress: row.treeAddress,
      treeId: row.treeId ?? '1',
      title: row.title,
      subtitle: row.subtitle ?? undefined,
      category: row.category,
      categoryBadge: row.categoryBadge,
      narrative: row.narrative,
      story: row.story ?? undefined,
      investorHighlight: row.investorHighlight ?? undefined,
      victronSiteId: row.victronSiteId ?? undefined,
      city: row.city,
      country: row.country,
      projectedApy: row.projectedApy,
      tariffRate: row.tariffRate,
      offTakerName: row.offTakerName,
      offTakerDescription: row.offTakerDescription ?? undefined,
      supplierName: row.supplierName ?? undefined,
      targetUsdc: row.targetUsdc,
      createdAt: Number(row.createdAt),
      updatedAt: Number(row.updatedAt),
    };
  }
}
