import { useState, useEffect } from 'react';
import { useEnrichedCampaigns } from '../victron/use-enriched-campaigns';
import { useVictronInvestments } from '../victron/use-victron-investments';
import { useConnectedWallet } from '../wallet/use-connected-wallet';
import { useMockUsdc } from '../marketplace/hooks/use-mock-usdc';
import { formatTokenAmount } from '../../chain/amounts';
import {
  getCampaignCoverImage,
  CAMPAIGN_METADATA,
} from '../victron/campaign-helpers';
import type { VictronDemoItem } from '../victron/victron-types';
import {
  SunIcon,
  BatteryIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  ExternalLinkIcon,
} from '../victron/victron-icons';

interface InvestorPortfolioProps {
  onSelectAsset?: (siteId: number) => void;
  onExplore?: () => void;
  onOpenDeposit?: () => void;
  onBackProject?: (demo: VictronDemoItem) => void;
}

export function InvestorPortfolio({
  onSelectAsset,
  onExplore,
  onOpenDeposit,
  onBackProject,
}: InvestorPortfolioProps) {
  const wallet = useConnectedWallet();
  const balance = useMockUsdc(wallet?.address);
  const { investments, claimYield } = useVictronInvestments(wallet?.address);
  const [elapsedTicks, setElapsedTicks] = useState(0);
  const [justClaimedMap, setJustClaimedMap] = useState<Record<number, string>>(
    {},
  );
  const [horizonYears, setHorizonYears] = useState<1 | 5 | 15>(15);

  const { demos } = useEnrichedCampaigns();

  // Ticking effect for live yield streaming
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTicks((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const backedDemos = demos.filter(
    (d) => (investments[d.siteId]?.amountUsdc ?? 0) > 0,
  );

  // Aggregations
  let totalInvestedUsdc = 0;
  let totalAnnualYieldUsdc = 0;
  let totalEnergyDeliveredKwh = 0;
  let totalAccruedUsdc = 0;

  for (const demo of backedDemos) {
    const holding = investments[demo.siteId]!;
    const target = demo.financials.targetUsdc || 10000;
    const apyFraction = demo.financials.projectedApy / 100;
    const holdingAnnual = holding.amountUsdc * apyFraction;
    const secondsInYear = 365 * 24 * 3600;
    const stream = (holdingAnnual / secondsInYear) * (elapsedTicks + 1);

    totalInvestedUsdc += holding.amountUsdc;
    totalAnnualYieldUsdc += holdingAnnual;
    totalAccruedUsdc += Math.max(0.0001, stream);

    const shareFraction = holding.amountUsdc / target;
    const siteKwh = demo.energyStats.year.solarYieldKwh;
    totalEnergyDeliveredKwh += siteKwh * shareFraction;
  }

  const averageApy =
    totalInvestedUsdc > 0
      ? ((totalAnnualYieldUsdc / totalInvestedUsdc) * 100).toFixed(1)
      : '14.2';

  const handleClaim = (siteId: number, amount: number) => {
    if (amount <= 0) return;
    claimYield(siteId, amount);
    setJustClaimedMap((prev) => ({
      ...prev,
      [siteId]: `Claimed +$${amount.toFixed(4)} mockUSDC`,
    }));
    setTimeout(() => {
      setJustClaimedMap((prev) => {
        const next = { ...prev };
        delete next[siteId];
        return next;
      });
    }, 3500);
  };

  const handleClaimAll = () => {
    for (const demo of backedDemos) {
      const holding = investments[demo.siteId];
      if (!holding || holding.amountUsdc <= 0) continue;
      const holdingApy = demo.financials.projectedApy / 100;
      const holdingAnnual = holding.amountUsdc * holdingApy;
      const stream = (holdingAnnual / (365 * 24 * 3600)) * (elapsedTicks + 1);
      handleClaim(demo.siteId, Math.max(0.0001, stream));
    }
  };

  return (
    <section
      id="investor-portfolio"
      aria-label="Investor Portfolio"
      className="py-6 space-y-10 animate-fade-in"
    >
      {/* 1. PORTFOLIO COMMAND CENTER HEADER */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between border-b border-black/10 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#183d89]/10 px-3.5 py-1 font-mono text-[11px] font-semibold text-[#183d89]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#183d89]" />
            FINTECH PORTFOLIO · DEPIN CASHFLOWS
          </div>
          <h1 className="mt-3 text-3xl font-medium tracking-tight text-zinc-950 sm:text-5xl">
            My Energy Infrastructure Portfolio
          </h1>
          <p className="mt-3 max-w-2xl text-base text-zinc-600 font-light leading-relaxed">
            Monitor real physical hardware allocations, live Victron Cerbo GX
            kilowatt-hour generation, and daily bond yields streaming into your
            wallet in 1:1 stable currency.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Balance Pill */}
          <div className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-mono shadow-2xs">
            <span className="text-zinc-500">Balance: </span>
            <strong className="text-zinc-950 font-semibold">
              {balance.data
                ? `$${formatTokenAmount(balance.data.balance)} mockUSDC`
                : '$0.00 mockUSDC'}
            </strong>
          </div>

          {/* Add Funds Trigger */}
          {onOpenDeposit && (
            <button
              type="button"
              onClick={onOpenDeposit}
              className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white hover:bg-black/5 px-4 py-2 text-xs font-mono font-medium text-zinc-800 shadow-2xs transition cursor-pointer"
            >
              <CurrencyDollarIcon className="h-4 w-4 text-[#183d89]" />
              <span>+ Deposit Funds</span>
            </button>
          )}

          {/* Claim All Button */}
          {backedDemos.length > 0 && totalAccruedUsdc > 0 && (
            <button
              type="button"
              onClick={handleClaimAll}
              className="flex items-center gap-2 rounded-full bg-[#183d89] hover:bg-[#2762ad] px-5 py-2 text-xs font-semibold text-white shadow-sm transition active:scale-[0.99] cursor-pointer"
            >
              <span>Claim All (${totalAccruedUsdc.toFixed(4)} USDC)</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. FINANCIAL KPI RIBBON */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* KPI 1 */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-xs space-y-1">
          <span className="block font-mono text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Total Capital Backed
          </span>
          <span className="block font-mono text-3xl font-light text-zinc-950 sm:text-4xl">
            ${totalInvestedUsdc.toLocaleString()}
          </span>
          <span className="block text-xs text-zinc-500 font-light pt-1">
            Across {backedDemos.length} clean energy installation
            {backedDemos.length === 1 ? '' : 's'}
          </span>
        </div>

        {/* KPI 2 */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-xs space-y-1">
          <span className="block font-mono text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Clean Energy Delivered
          </span>
          <span className="block font-mono text-3xl font-light text-[#183d89] sm:text-4xl">
            {totalEnergyDeliveredKwh >= 1000
              ? `${(totalEnergyDeliveredKwh / 1000).toFixed(2)} MWh`
              : `${totalEnergyDeliveredKwh.toFixed(1)} kWh`}
          </span>
          <span className="block text-xs text-zinc-500 font-light pt-1">
            Signed by Cerbo GX SCADA
          </span>
        </div>

        {/* KPI 3 */}
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-xs space-y-1">
          <span className="block font-mono text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
            Weighted Average Yield
          </span>
          <span className="block font-mono text-3xl font-light text-zinc-950 sm:text-4xl">
            {averageApy}% <span className="text-sm text-zinc-500">APY</span>
          </span>
          <span className="block text-xs text-zinc-500 font-light pt-1">
            +${totalAnnualYieldUsdc.toFixed(2)} / yr contracted
          </span>
        </div>

        {/* KPI 4: LIVE STREAMING DIVIDENDS */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/50 p-6 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="block font-mono text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">
              Live Accrued Dividends
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <span className="block font-mono text-3xl font-light text-emerald-950 sm:text-4xl">
            +${totalAccruedUsdc.toFixed(4)}
          </span>
          <span className="block text-xs text-emerald-700 font-light pt-1">
            Streaming per second · 1:1 USD peg
          </span>
        </div>
      </div>

      {/* 3. ACTIVE BACKED ASSETS SECTION */}
      {backedDemos.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#183d89]">
                Active Holdings
              </span>
              <h2 className="mt-1 text-2xl font-medium tracking-tight text-zinc-950">
                Your Hardware Allocations ({backedDemos.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={onExplore}
              className="text-xs font-mono font-semibold text-[#183d89] hover:underline flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>Back More Pools</span>
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {backedDemos.map((demo) => {
              const holding = investments[demo.siteId]!;
              const target = demo.financials.targetUsdc || 10000;
              const poolSharePercent = (
                (holding.amountUsdc / target) *
                100
              ).toFixed(2);
              const holdingApy = demo.financials.projectedApy / 100;
              const holdingAnnual = holding.amountUsdc * holdingApy;
              const stream =
                (holdingAnnual / (365 * 24 * 3600)) * (elapsedTicks + 1);
              const accrued = Math.max(0.0001, stream);
              const claimedText = justClaimedMap[demo.siteId];

              return (
                <article
                  key={demo.siteId}
                  className="flex flex-col justify-between rounded-2xl border border-black/10 bg-white p-6 shadow-xs hover:border-black/25 hover:shadow-lg transition-all"
                >
                  <div className="space-y-4">
                    {/* Top Row: Thumbnail + Category + Title */}
                    <div className="flex gap-4 items-start">
                      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-zinc-100 border border-black/10">
                        <img
                          src={getCampaignCoverImage(demo.key)}
                          alt={demo.title}
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute bottom-1 left-1 rounded bg-zinc-950/80 px-1.5 py-0.2 font-mono text-[9px] font-bold text-white">
                          {demo.financials.projectedApy}% APY
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="font-semibold uppercase tracking-wider text-[#183d89]">
                            {demo.categoryBadge}
                          </span>
                          <span className="flex items-center gap-1 text-emerald-700 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live Telemetry
                          </span>
                        </div>
                        <h3 className="mt-1 text-lg font-medium text-zinc-950">
                          {demo.title}
                        </h3>
                        <p className="font-mono text-xs text-zinc-500">
                          {demo.location.city}, {demo.location.country} ·{' '}
                          {CAMPAIGN_METADATA[demo.key]?.creator ?? 'Operator'}
                        </p>
                      </div>
                    </div>

                    {/* Ownership & Dividend Metrics */}
                    <div className="grid grid-cols-2 gap-3 rounded-xl bg-zinc-50/80 border border-black/5 p-4 text-xs">
                      <div>
                        <span className="block text-zinc-500 font-light">
                          Your Allocation
                        </span>
                        <span className="mt-0.5 block font-mono text-lg font-medium text-zinc-950">
                          ${holding.amountUsdc.toLocaleString()} USDC
                        </span>
                        <span className="text-[11px] text-zinc-500 font-mono">
                          {poolSharePercent}% of Pool Stake
                        </span>
                      </div>
                      <div>
                        <span className="block text-zinc-500 font-light">
                          Projected Return
                        </span>
                        <span className="mt-0.5 block font-mono text-lg font-medium text-[#183d89]">
                          {demo.financials.projectedApy}% APY
                        </span>
                        <span className="text-[11px] text-zinc-600 font-mono">
                          +${holdingAnnual.toFixed(2)} / yr
                        </span>
                      </div>
                    </div>

                    {/* Live SCADA Telemetry Glance */}
                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-black/5 bg-zinc-50/50 p-2.5 text-xs">
                      <div className="flex items-center gap-1.5">
                        <SunIcon className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <div>
                          <span className="block text-[10px] text-zinc-400 font-mono uppercase">
                            Current Power
                          </span>
                          <span className="font-mono font-medium text-zinc-900 text-xs">
                            {(demo.currentPower.solarYieldWatts / 1000).toFixed(
                              1,
                            )}{' '}
                            kW
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <BatteryIcon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <div>
                          <span className="block text-[10px] text-zinc-400 font-mono uppercase">
                            Storage Charge
                          </span>
                          <span className="font-mono font-medium text-zinc-900 text-xs">
                            {demo.currentPower.batterySocPercent.toFixed(0)}%
                            SOC
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Live Accrued Yield Box */}
                    <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-50/60 p-4">
                      <div>
                        <span className="block font-mono text-[10px] uppercase font-semibold text-emerald-800">
                          Unclaimed Kilowatt-Hour Dividend
                        </span>
                        <span className="font-mono text-xl font-medium text-emerald-950 mt-0.5 block">
                          +${accrued.toFixed(4)} mockUSDC
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleClaim(demo.siteId, accrued)}
                        className="rounded-full bg-[#183d89] hover:bg-[#2762ad] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition active:scale-[0.99] cursor-pointer"
                      >
                        Claim Yield
                      </button>
                    </div>

                    {claimedText && (
                      <p className="text-center font-mono text-xs font-bold text-emerald-700">
                        {claimedText}
                      </p>
                    )}
                  </div>

                  {/* Footer Action */}
                  <div className="mt-5 border-t border-black/10 pt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectAsset?.(demo.siteId)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-full border border-black/10 bg-white hover:bg-black/5 py-2.5 text-xs font-mono font-medium text-zinc-800 transition cursor-pointer"
                    >
                      <span>Inspect SCADA Telemetry & PPA</span>
                      <ExternalLinkIcon className="h-3 w-3 text-zinc-500" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        /* Empty State with Discovery Cards */
        <div className="rounded-3xl border border-black/10 bg-white p-8 sm:p-12 shadow-xs text-center space-y-8">
          <div className="max-w-md mx-auto space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#183d89] border border-blue-100">
              <ShieldCheckIcon className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-medium tracking-tight text-zinc-950 sm:text-3xl">
              No Active Allocations Yet
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 font-light leading-relaxed">
              Back high-yield physical energy pools starting at just $50. Stream
              real-time kilowatt-hour cashflows secured by Solana smart
              contracts.
            </p>
            {onOpenDeposit && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenDeposit}
                  className="inline-flex items-center gap-2 rounded-full bg-[#183d89] hover:bg-[#2762ad] px-6 py-3 text-xs font-semibold text-white shadow-sm transition active:scale-[0.99] cursor-pointer"
                >
                  <CurrencyDollarIcon className="h-4 w-4" />
                  <span>Deposit Capital ($1,000 mockUSDC)</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Start Top 3 Pools */}
          <div className="border-t border-black/10 pt-8 text-left space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Recommended Opportunities
              </span>
              <button
                type="button"
                onClick={onExplore}
                className="font-mono text-xs font-semibold text-[#183d89] hover:underline cursor-pointer"
              >
                View all pools →
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {demos.slice(0, 3).map((demo) => (
                <div
                  key={demo.siteId}
                  className="rounded-2xl border border-black/10 bg-zinc-50/70 p-4 flex flex-col justify-between space-y-3 hover:border-black/25 transition"
                >
                  <div>
                    <span className="font-mono text-[10px] font-bold uppercase text-[#183d89]">
                      {demo.categoryBadge}
                    </span>
                    <h3 className="mt-1 font-medium text-zinc-950 text-sm">
                      {demo.title}
                    </h3>
                    <span className="mt-1 block font-mono text-lg font-light text-[#183d89]">
                      {demo.financials.projectedApy}% APY
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      onBackProject
                        ? onBackProject(demo)
                        : onSelectAsset?.(demo.siteId)
                    }
                    className="flex w-full items-center justify-center gap-1.5 rounded-full bg-zinc-950 hover:bg-[#183d89] py-2 text-xs font-semibold text-white transition active:scale-[0.99] cursor-pointer"
                  >
                    <span>Back This Pool</span>
                    <ArrowRightIcon className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. INTERACTIVE 15-YEAR PPA HORIZON COMPARISON */}
      <div className="rounded-3xl border border-black/10 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/10 pb-5">
          <div>
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#183d89]">
              Institutional Cash Flow Model
            </span>
            <h3 className="mt-1 text-xl font-medium text-zinc-950 sm:text-2xl">
              15-Year Industrial PPA Yield Horizon
            </h3>
            <p className="mt-1 text-xs text-zinc-500 font-light">
              Compare contracted clean energy infrastructure cashflows against
              traditional yield instruments over the full asset lifespan.
            </p>
          </div>

          {/* Horizon Pills */}
          <div className="flex items-center gap-1.5 rounded-full border border-black/10 bg-zinc-50 p-1 font-mono text-xs">
            {([1, 5, 15] as const).map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => setHorizonYears(yr)}
                className={`rounded-full px-4 py-1.5 font-semibold transition cursor-pointer ${
                  horizonYears === yr
                    ? 'bg-zinc-950 text-white shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-950'
                }`}
              >
                {yr} {yr === 1 ? 'Year' : 'Years'}
              </button>
            ))}
          </div>
        </div>

        {/* Horizon Comparison Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Treetino */}
          <div className="rounded-2xl border-2 border-[#183d89] bg-blue-50/40 p-5 space-y-2">
            <span className="font-mono text-[10px] font-bold uppercase text-[#183d89]">
              Treetino Energy Bond
            </span>
            <div className="font-mono text-3xl font-light text-zinc-950">
              15.2% <span className="text-xs text-zinc-500">APY</span>
            </div>
            <div className="font-mono text-sm font-semibold text-[#183d89]">
              +${(1000 * Math.pow(1 + 0.152, horizonYears) - 1000).toFixed(0)}{' '}
              return / $1,000
            </div>
            <p className="text-[11px] text-zinc-600 font-light leading-snug">
              Contracted industrial off-taker PPA backed by physical hardware
              and daily SCADA billing.
            </p>
          </div>

          {/* US Treasury */}
          <div className="rounded-2xl border border-black/10 bg-zinc-50/70 p-5 space-y-2">
            <span className="font-mono text-[10px] font-semibold uppercase text-zinc-500">
              10-Yr US Treasury Bond
            </span>
            <div className="font-mono text-3xl font-light text-zinc-950">
              4.2% <span className="text-xs text-zinc-500">APY</span>
            </div>
            <div className="font-mono text-sm font-semibold text-zinc-700">
              +${(1000 * Math.pow(1 + 0.042, horizonYears) - 1000).toFixed(0)}{' '}
              return / $1,000
            </div>
            <p className="text-[11px] text-zinc-500 font-light leading-snug">
              Standard sovereign benchmark. Locked maturity, fixed yield.
            </p>
          </div>

          {/* S&P Dividend */}
          <div className="rounded-2xl border border-black/10 bg-zinc-50/70 p-5 space-y-2">
            <span className="font-mono text-[10px] font-semibold uppercase text-zinc-500">
              S&P 500 Dividend Aristocrats
            </span>
            <div className="font-mono text-3xl font-light text-zinc-950">
              1.6% <span className="text-xs text-zinc-500">APY</span>
            </div>
            <div className="font-mono text-sm font-semibold text-zinc-700">
              +${(1000 * Math.pow(1 + 0.016, horizonYears) - 1000).toFixed(0)}{' '}
              return / $1,000
            </div>
            <p className="text-[11px] text-zinc-500 font-light leading-snug">
              Equities yield without principal guarantees. Subject to market
              equity volatility.
            </p>
          </div>

          {/* Bank Savings */}
          <div className="rounded-2xl border border-black/10 bg-zinc-50/70 p-5 space-y-2">
            <span className="font-mono text-[10px] font-semibold uppercase text-zinc-500">
              Traditional Savings Account
            </span>
            <div className="font-mono text-3xl font-light text-zinc-950">
              0.5% <span className="text-xs text-zinc-500">APY</span>
            </div>
            <div className="font-mono text-sm font-semibold text-zinc-700">
              +${(1000 * Math.pow(1 + 0.005, horizonYears) - 1000).toFixed(0)}{' '}
              return / $1,000
            </div>
            <p className="text-[11px] text-zinc-500 font-light leading-snug">
              Negative real return after inflation. Full custodian risk.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
