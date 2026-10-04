import type { ReactNode } from 'react';
import { TrendUpIcon } from '../victron-icons';

export interface SummaryMetricItem {
  label: string;
  value: string;
  subtext: string;
  icon?: ReactNode;
}

export interface FlowSummaryBannerProps {
  generation: SummaryMetricItem;
  consumption: SummaryMetricItem;
  revenueOrSavings: SummaryMetricItem;
  investorYield: {
    apyPercent: number;
    annualDistribution: string;
    subtext?: string;
  };
}

export function FlowSummaryBanner({
  generation,
  consumption,
  revenueOrSavings,
  investorYield,
}: FlowSummaryBannerProps) {
  return (
    <div className="rounded-xl border border-emerald-600/20 bg-emerald-50/50 p-4 text-xs">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-emerald-600/20">
        {/* Metric 1: Clean Generation */}
        <div className="sm:pr-4">
          <span className="font-mono text-[10px] text-emerald-800 uppercase font-bold tracking-wider">
            {generation.label}
          </span>
          <div className="mt-1 font-mono text-lg font-black text-emerald-950">
            {generation.value}
          </div>
          <p className="text-[11px] text-emerald-800">{generation.subtext}</p>
        </div>

        {/* Metric 2: Primary Consumption */}
        <div className="pt-2 sm:pt-0 sm:px-4">
          <span className="font-mono text-[10px] text-emerald-800 uppercase font-bold tracking-wider">
            {consumption.label}
          </span>
          <div className="mt-1 font-mono text-lg font-black text-emerald-950">
            {consumption.value}
          </div>
          <p className="text-[11px] text-emerald-800">{consumption.subtext}</p>
        </div>

        {/* Metric 3: Economic Run-Rate */}
        <div className="pt-2 sm:pt-0 sm:px-4">
          <span className="font-mono text-[10px] text-emerald-800 uppercase font-bold tracking-wider">
            {revenueOrSavings.label}
          </span>
          <div className="mt-1 font-mono text-lg font-black text-emerald-950">
            {revenueOrSavings.value}
          </div>
          <p className="text-[11px] text-emerald-800">
            {revenueOrSavings.subtext}
          </p>
        </div>

        {/* Metric 4: Investor Yield Stream */}
        <div className="pt-2 sm:pt-0 sm:pl-4">
          <span className="font-mono text-[10px] text-emerald-800 uppercase font-bold tracking-wider">
            Tokenholder Distribution
          </span>
          <div className="mt-1 font-mono text-lg font-black text-emerald-950 flex items-center gap-1.5">
            <TrendUpIcon className="h-4 w-4 text-emerald-700" />
            <span>{investorYield.apyPercent}% APY</span>
            <span className="text-xs font-normal text-emerald-800">
              (${investorYield.annualDistribution} / yr)
            </span>
          </div>
          <p className="text-[11px] text-emerald-800">
            {investorYield.subtext ||
              'Direct programmatic yield distributions on Solana'}
          </p>
        </div>
      </div>
    </div>
  );
}
