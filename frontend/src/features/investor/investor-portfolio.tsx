import { useState, useEffect } from 'react';
import { useEnrichedCampaigns } from '../victron/use-enriched-campaigns';
import { useVictronInvestments } from '../victron/use-victron-investments';
import { useConnectedWallet } from '../wallet/use-connected-wallet';
import { useMockUsdc } from '../marketplace/hooks/use-mock-usdc';
import { usePublicTransactions } from '../marketplace/hooks/use-public-transactions';
import { formatTokenAmount, parseTokenAmount } from '../../chain/amounts';
import {
  BoltIcon,
  SunIcon,
  BatteryIcon,
  ArrowRightIcon,
  TrendUpIcon,
} from '../victron/victron-icons';

interface InvestorPortfolioProps {
  onSelectAsset?: (siteId: number) => void;
  onExplore?: () => void;
}

export function InvestorPortfolio({
  onSelectAsset,
  onExplore,
}: InvestorPortfolioProps) {
  const wallet = useConnectedWallet();
  const balance = useMockUsdc(wallet?.address);
  const publicTx = usePublicTransactions(wallet);
  const { investments, claimYield } = useVictronInvestments(wallet?.address);
  const [elapsedTicks, setElapsedTicks] = useState(0);
  const [justClaimedMap, setJustClaimedMap] = useState<Record<number, string>>(
    {},
  );

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
      : '0.0';

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
      className="py-8 space-y-8 animate-fade-in"
    >
      {/* 1. Header Banner */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-forest/15 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-800">
              Investor Dashboard · Verified DePIN Yield
            </span>
          </div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-forest sm:text-4xl">
            My Backed Clean Energy Assets
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-forest/75 sm:text-sm">
            Continuous tokenized dividend streams generated from real-world
            kilowatt-hours metered by Victron Cerbo GX gateways.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {wallet ? (
            <>
              <div className="rounded-xl border border-forest/15 bg-white px-4 py-2.5 text-xs font-mono shadow-xs">
                <span className="text-forest/60">Balance: </span>
                <strong className="text-forest font-bold">
                  {balance.data
                    ? `${formatTokenAmount(balance.data.balance)} mockUSDC`
                    : '…'}
                </strong>
              </div>
              <button
                type="button"
                disabled={publicTx.isPending}
                onClick={() =>
                  publicTx.mutate({
                    action: 'giveMeMoney',
                    amount: parseTokenAmount('1000'),
                  })
                }
                className="rounded-xl border border-forest/20 bg-white px-3.5 py-2.5 text-xs font-bold font-mono text-forest hover:bg-forest/5 transition disabled:opacity-50 shadow-2xs"
              >
                {publicTx.isPending ? 'Minting…' : '+ Faucet 1,000 USDC'}
              </button>
            </>
          ) : (
            <div className="rounded-xl border border-amber-600/30 bg-amber-50 px-4 py-2 text-xs font-mono text-amber-900">
              Simulation Mode (Connect Wallet for On-Chain Settlement)
            </div>
          )}

          {backedDemos.length > 0 && totalAccruedUsdc > 0 && (
            <button
              type="button"
              onClick={handleClaimAll}
              className="rounded-xl bg-forest px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#23573e] active:scale-[0.98]"
            >
              Claim All (${totalAccruedUsdc.toFixed(4)} USDC)
            </button>
          )}
        </div>
      </div>

      {publicTx.isSuccess && (
        <div className="rounded-xl border border-emerald-600/30 bg-emerald-50/80 p-3 text-xs font-bold text-emerald-900">
          Transaction confirmed on Solana devnet! Balance refreshed.
        </div>
      )}
      {publicTx.error && (
        <div className="rounded-xl border border-rose-600/30 bg-rose-50 p-3 text-xs font-bold text-rose-900">
          {publicTx.error.message}
        </div>
      )}

      {/* 2. Portfolio KPI Ribbon */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-forest/15 bg-white p-5 shadow-xs">
          <span className="block font-mono text-xs font-bold text-forest/60 uppercase">
            Total Capital Backed
          </span>
          <span className="mt-1 block font-mono text-3xl font-black text-forest">
            ${totalInvestedUsdc.toLocaleString()}
          </span>
          <span className="mt-1 block text-xs text-forest/60">
            Across {backedDemos.length} clean energy installation
            {backedDemos.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="rounded-2xl border border-forest/15 bg-white p-5 shadow-xs">
          <span className="block font-mono text-xs font-bold text-forest/60 uppercase">
            Clean Energy Generated
          </span>
          <span className="mt-1 block font-mono text-3xl font-black text-emerald-800">
            {totalEnergyDeliveredKwh >= 1000
              ? `${(totalEnergyDeliveredKwh / 1000).toFixed(2)} MWh`
              : `${totalEnergyDeliveredKwh.toFixed(1)} kWh`}
          </span>
          <span className="mt-1 block text-xs text-forest/60">
            Your hardware share production
          </span>
        </div>

        <div className="rounded-2xl border border-forest/15 bg-white p-5 shadow-xs">
          <span className="block font-mono text-xs font-bold text-forest/60 uppercase">
            Weighted Average APY
          </span>
          <span className="mt-1 block font-mono text-3xl font-black text-emerald-800">
            {averageApy}%
          </span>
          <span className="mt-1 block text-xs text-forest/60">
            Projected annual dividend rate
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-600/30 bg-emerald-50/70 p-5 shadow-xs">
          <span className="block font-mono text-xs font-bold text-emerald-800 uppercase">
            Live Accrued Dividends
          </span>
          <span className="mt-1 block font-mono text-3xl font-black text-emerald-950">
            +${totalAccruedUsdc.toFixed(4)}
          </span>
          <span className="mt-1 flex items-center gap-1.5 text-xs text-emerald-800 font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            Streaming live per second
          </span>
        </div>
      </div>

      {/* 3. Backed Projects List */}
      {backedDemos.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-forest">
              Your Hardware Allocations ({backedDemos.length})
            </h2>
            <button
              type="button"
              onClick={onExplore}
              className="text-xs font-bold text-leaf hover:underline flex items-center gap-1"
            >
              <span>Back More Clean Energy Installations</span>
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
                  className="flex flex-col justify-between rounded-2xl border border-forest/15 bg-white p-6 shadow-sm hover:border-forest/30 transition-all"
                >
                  <div>
                    {/* Top Row: Category & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-bold text-forest/60 uppercase">
                        {demo.categoryBadge} · Site #{demo.siteId}
                      </span>
                      <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-emerald-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        Generating Power
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="mt-2 text-xl font-bold text-forest">
                      {demo.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-forest/60">
                      {demo.location.city}, {demo.location.country} ·{' '}
                      {demo.financials.tariffRate}
                    </p>

                    {/* Ownership & Dividend Cards */}
                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-forest/5 p-4 text-xs">
                      <div>
                        <span className="block text-forest/60 font-medium">
                          Your Capital Stake
                        </span>
                        <span className="mt-0.5 block font-mono text-lg font-black text-forest">
                          ${holding.amountUsdc.toLocaleString()} USDC
                        </span>
                        <span className="text-[11px] text-forest/60 font-mono">
                          {poolSharePercent}% of Pool
                        </span>
                      </div>
                      <div>
                        <span className="block text-forest/60 font-medium">
                          Projected Return
                        </span>
                        <span className="mt-0.5 block font-mono text-lg font-black text-emerald-800">
                          {demo.financials.projectedApy}% APY
                        </span>
                        <span className="text-[11px] text-emerald-800 font-mono">
                          +${holdingAnnual.toFixed(2)} / yr
                        </span>
                      </div>
                    </div>

                    {/* Live SCADA Telemetry Glance */}
                    <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-forest/10 bg-cream/40 p-2.5 text-xs">
                      <div className="flex items-center gap-1.5">
                        <SunIcon className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <div>
                          <span className="block text-[10px] text-forest/50">
                            Solar Yield
                          </span>
                          <span className="font-mono font-bold text-forest text-xs">
                            {(demo.currentPower.solarYieldWatts / 1000).toFixed(
                              1,
                            )}{' '}
                            kW
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <BatteryIcon className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                        <div>
                          <span className="block text-[10px] text-forest/50">
                            Battery SOC
                          </span>
                          <span className="font-mono font-bold text-forest text-xs">
                            {demo.currentPower.batterySocPercent.toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <BoltIcon className="h-3.5 w-3.5 text-sky-700 shrink-0" />
                        <div>
                          <span className="block text-[10px] text-forest/50">
                            Year Totals
                          </span>
                          <span className="font-mono font-bold text-forest text-xs">
                            {demo.energyStats.year.solarYieldKwh.toLocaleString()}{' '}
                            kWh
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Live Accrued Yield Action Box */}
                    <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-600/30 bg-emerald-50/70 p-3.5">
                      <div>
                        <span className="block font-mono text-[10px] uppercase font-bold text-emerald-800">
                          Unclaimed Accrued Yield
                        </span>
                        <span className="font-mono text-xl font-extrabold text-emerald-950">
                          +${accrued.toFixed(4)} mockUSDC
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleClaim(demo.siteId, accrued)}
                        className="rounded-xl bg-forest px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#23573e] transition"
                      >
                        Claim Yield
                      </button>
                    </div>

                    {claimedText && (
                      <p className="mt-2 text-center text-xs font-bold text-emerald-800">
                        {claimedText}
                      </p>
                    )}
                  </div>

                  {/* Footer Action */}
                  <div className="mt-5 border-t border-forest/10 pt-3">
                    <button
                      type="button"
                      onClick={() => onSelectAsset?.(demo.siteId)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-forest/20 bg-white py-2.5 text-xs font-bold text-forest hover:bg-forest/5 transition"
                    >
                      <TrendUpIcon className="h-3.5 w-3.5" />
                      <span>
                        Inspect Live Electrical Schematic & PPA Dossier
                      </span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Mathematical Proof-of-Yield Explanation Box */}
          <div className="rounded-2xl border border-forest/15 bg-cream/40 p-6 text-xs text-forest/80 shadow-xs">
            <h4 className="font-bold text-sm text-forest flex items-center gap-2">
              <BoltIcon className="h-4 w-4 text-emerald-800" />
              <span>
                How Your Yield Is Calculated (DePIN Verification Rule)
              </span>
            </h4>
            <p className="mt-1 leading-relaxed">
              Every kilowatt-hour generated by the installation is metered and
              digitally signed on-site by the Cerbo GX gateway running Venus OS.
              The off-taker pays the agreed PPA tariff into the smart contract
              revenue vault. Yield is distributed proportionally to tokenholders
              without intermediary banking fees:
            </p>
            <div className="mt-3 rounded-lg border border-forest/10 bg-white p-3 font-mono text-xs text-forest">
              Investor Dividend = Metered Production (kWh) × Off-Taker Tariff
              Rate ($/kWh) × Ownership Stake (%)
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-forest/25 bg-white/70 p-12 text-center shadow-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-leaf/15 text-forest">
            <BoltIcon className="h-8 w-8 text-forest" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-forest">
            You haven't backed any clean energy assets yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-xs text-forest/75 sm:text-sm">
            Fund real-world solar microgrids, battery arbitrage storage, or
            smart energy trees. Earn automated dividend yields directly from
            verified hardware telemetry.
          </p>

          <div className="mt-6">
            <button
              type="button"
              onClick={onExplore}
              className="inline-flex items-center gap-2 rounded-xl bg-forest px-6 py-3 font-bold text-white shadow-sm hover:bg-[#23573e] transition"
            >
              <span>Explore Active Funding Opportunities</span>
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
