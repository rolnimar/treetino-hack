export function getCampaignCoverImage(key: string): string {
  switch (key) {
    case 'treetino-v1':
      return '/campaigns/treetino-v1.jpg';
    case 'ess':
      return '/campaigns/ess.jpg';
    case 'ev':
      return '/campaigns/ev.jpg';
    case 'offgrid':
      return '/campaigns/offgrid.jpg';
    default:
      return '/campaigns/treetino-v1.jpg';
  }
}

export const CAMPAIGN_METADATA: Record<
  string,
  {
    creator: string;
    daysLeft: number;
    backers: number;
    tagline: string;
    hardwareType: string;
  }
> = {
  'treetino-v1': {
    creator: 'MKovo Engineering',
    daysLeft: 14,
    backers: 48,
    tagline: '12m Sculptural solar & wind tree feeding metal fabrication plant',
    hardwareType: 'Dual-Modality Microgrid',
  },
  ess: {
    creator: 'EnergyHub Amsterdam',
    daysLeft: 21,
    backers: 36,
    tagline: 'High-voltage BESS trading automated day-ahead wholesale spreads',
    hardwareType: 'Battery Arbitrage Hub',
  },
  ev: {
    creator: 'ChargeVolt Paris',
    daysLeft: 9,
    backers: 82,
    tagline: 'Solar canopy & DC fast chargers servicing delivery fleets',
    hardwareType: 'Fleet Charging Plaza',
  },
  offgrid: {
    creator: 'Outback Power QLD',
    daysLeft: 18,
    backers: 27,
    tagline:
      'Self-sufficient agricultural homestead microgrid with lithium storage',
    hardwareType: 'Homestead Microgrid',
  },
};
