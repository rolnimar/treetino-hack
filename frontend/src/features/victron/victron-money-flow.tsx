import { useState, useEffect } from 'react';
import type { VictronDemoItem } from './victron-types';
import { useVictronInvestments } from './use-victron-investments';
import { useConnectedWallet } from '../wallet/use-connected-wallet';
import { usePublicTransactions } from '../marketplace/hooks/use-public-transactions';
import { parseTokenAmount } from '../../chain/amounts';
import { CheckIcon } from './victron-icons';

interface VictronMoneyFlowProps {
  demo: VictronDemoItem;
  walletAddress?: string;
  walletBalance?: string;
}

export function VictronMoneyFlow({
  demo,
  walletAddress,
  walletBalance,
}: VictronMoneyFlowProps) {
  const [investAmount, setInvestAmount] = useState<number>(500);
  const [justInvested, setJustInvested] = useState<boolean>(false);
  const [elapsedTicks, setElapsedTicks] = useState<number>(0);

  const { investments, invest } = useVictronInvestments(walletAddress);
  const currentHolding = investments[demo.siteId];

  // Ticking effect for live streaming yield
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTicks((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Proportional calculations
  const target = demo.financials.targetUsdc || 10000;
  const apyFraction = demo.financials.projectedApy / 100;
  const poolSharePercent = ((investAmount / target) * 100).toFixed(2);
  const annualDividend = (investAmount * apyFraction).toFixed(2);
  const monthlyDividend = ((investAmount * apyFraction) / 12).toFixed(2);
  const dailyDividend = ((investAmount * apyFraction) / 365).toFixed(2);

  // Live accrued yield calculation
  const calculateAccrued = () => {
    if (!currentHolding || currentHolding.amountUsdc <= 0) return 0;
    const holdingApy = demo.financials.projectedApy / 100;
    const holdingAnnual = currentHolding.amountUsdc * holdingApy;
    const secondsInYear = 365 * 24 * 3600;
    const stream = (holdingAnnual / secondsInYear) * (elapsedTicks + 1);
    return Math.max(0.0001, stream);
  };

  const accruedUsdc = calculateAccrued();

  const handleInvest = () => {
    if (investAmount <= 0) return;
    invest(demo.siteId, investAmount);
    setJustInvested(true);
    setTimeout(() => setJustInvested(false), 3500);
  };

  return (
    <div className="space-y-6">
      {/* 1. VISUAL MONEY FLOW PIPELINE */}
      <div className="rounded-2xl border border-forest/15 bg-white/90 p-5 shadow-sm sm:p-6">
        <div className="border-b border-forest/10 pb-4">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 font-semibold uppercase tracking-wider">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            Tokenized Cash Flow Pipeline
          </div>
          <h3 className="mt-1 text-xl font-bold tracking-tight text-forest sm:text-2xl">
            How Metered Kilowatt-Hours Turn Into Investor Yield
          </h3>
          <p className="mt-0.5 text-xs text-forest/70">
            Automated revenue settlement: Signed Cerbo GX energy telemetry
            directly triggers Solana smart contract dividend payouts.
          </p>
        </div>

        {/* 4-Step Visual Flow Cards */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Step 1 */}
          <div className="rounded-xl border border-amber-600/20 bg-amber-50/40 p-4 text-xs shadow-xs">
            <div className="font-mono text-[10px] text-amber-800 font-bold uppercase tracking-wider">
              Stage 01 · Metering
            </div>
            <div className="mt-1 font-bold text-forest text-sm">
              Metered Generation
            </div>
            <div className="mt-2 font-mono text-base font-extrabold text-amber-900">
              {demo.energyStats.year.solarYieldKwh.toLocaleString()} kWh / yr
            </div>
            <p className="mt-1.5 text-[11px] text-forest/70 leading-snug">
              Signed telemetry logged on-site by Venus OS Cerbo GX gateway.
            </p>
          </div>

          {/* Step 2 */}
          <div className="rounded-xl border border-sky-600/20 bg-sky-50/40 p-4 text-xs shadow-xs">
            <div className="font-mono text-[10px] text-sky-800 font-bold uppercase tracking-wider">
              Stage 02 · Tariff Billing
            </div>
            <div className="mt-1 font-bold text-forest text-sm">
              Energy Revenue
            </div>
            <div className="mt-2 font-mono text-base font-extrabold text-sky-950">
              ${demo.financials.estAnnualRevenueUsdc.toLocaleString()} / yr
            </div>
            <p className="mt-1.5 text-[11px] text-forest/70 leading-snug">
              {demo.financials.tariffRate}
            </p>
          </div>

          {/* Step 3 */}
          <div className="rounded-xl border border-forest/15 bg-cream/30 p-4 text-xs shadow-xs">
            <div className="font-mono text-[10px] text-forest/70 font-bold uppercase tracking-wider">
              Stage 03 · Operational
            </div>
            <div className="mt-1 font-bold text-forest text-sm">
              O&M & Connection
            </div>
            <div className="mt-2 font-mono text-base font-extrabold text-forest">
              {demo.financials.cashFlowWaterfall[1]?.amount ?? '-7%'}
            </div>
            <p className="mt-1.5 text-[11px] text-forest/70 leading-snug">
              Cerbo GX LTE connectivity, hardware insurance, and maintenance.
            </p>
          </div>

          {/* Step 4 */}
          <div className="rounded-xl border border-emerald-600/30 bg-emerald-50/60 p-4 text-xs shadow-xs">
            <div className="font-mono text-[10px] text-emerald-800 font-bold uppercase tracking-wider">
              Stage 04 · Distribution
            </div>
            <div className="mt-1 font-bold text-emerald-950 text-sm">
              Net Investor Yield
            </div>
            <div className="mt-2 font-mono text-xl font-black text-emerald-800">
              {demo.financials.projectedApy}% APY
            </div>
            <p className="mt-1.5 text-[11px] text-emerald-900 leading-snug">
              Automated dividend streams to verified tokenholder wallets.
            </p>
          </div>
        </div>

        {/* Detailed Annual Waterfall Table */}
        <div className="mt-6 overflow-hidden rounded-xl border border-forest/15 bg-white shadow-xs">
          <div className="border-b border-forest/10 bg-cream/40 px-4 py-3 font-mono text-xs font-bold text-forest uppercase tracking-wider">
            Annual Cash Flow Breakdown & Yield Waterfall
          </div>
          <div className="divide-y divide-forest/10 text-xs">
            {demo.financials.cashFlowWaterfall.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-wrap items-center justify-between p-4 gap-2"
              >
                <div>
                  <div className="font-bold text-forest text-sm flex items-center gap-2">
                    <span>{item.title}</span>
                    <span className="rounded-sm bg-forest/5 px-2 py-0.5 font-mono text-[10px] text-forest/80 font-bold">
                      {item.percentage}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-forest/70">
                    {item.description}
                  </p>
                </div>
                <div
                  className={`font-mono text-base font-extrabold ${
                    idx === demo.financials.cashFlowWaterfall.length - 1
                      ? 'text-emerald-800 text-lg'
                      : idx === 1
                        ? 'text-rose-700'
                        : 'text-forest'
                  }`}
                >
                  {item.amount}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. INVESTOR TERMINAL & LIVE ALLOCATION CALCULATOR */}
      <div className="rounded-2xl border border-forest/15 bg-white/90 p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-forest/10 pb-4">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-forest sm:text-2xl">
              Investor Allocation & Yield Terminal
            </h3>
            <p className="mt-0.5 text-xs text-forest/70">
              Calculate your exact hardware ownership and continuous dividend
              distribution.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-lg border border-forest/15 bg-cream/50 px-3.5 py-2 font-mono text-xs text-forest">
              <span className="text-forest/70">Connected Wallet: </span>
              {walletAddress ? (
                <span className="text-emerald-800 font-bold">
                  {walletAddress.slice(0, 4)}…{walletAddress.slice(-4)} (
                  {walletBalance ?? '0'} mockUSDC)
                </span>
              ) : (
                <span className="text-amber-800 font-semibold">
                  Demo Simulation
                </span>
              )}
            </div>

            {wallet && (
              <button
                type="button"
                disabled={publicTx.isPending}
                onClick={() =>
                  publicTx.mutate({
                    action: 'giveMeMoney',
                    amount: parseTokenAmount('1000'),
                  })
                }
                className="rounded-lg border border-emerald-700/30 bg-emerald-50 px-3 py-2 font-mono text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition disabled:opacity-50 shadow-2xs"
              >
                {publicTx.isPending ? 'Minting…' : '+ Faucet 1,000 USDC'}
              </button>
            )}
          </div>
        </div>

        {publicTx.isSuccess && (
          <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-600/30 p-2.5 text-xs font-bold text-emerald-800">
            Minted 1,000 mockUSDC to your devnet wallet!
          </div>
        )}
        {publicTx.error && (
          <div className="mt-3 rounded-lg bg-rose-50 border border-rose-600/30 p-2.5 text-xs font-bold text-rose-800">
            {publicTx.error.message}
          </div>
        )}

        {/* ACTIVE POSITION CARD IF INVESTED */}
        {currentHolding && currentHolding.amountUsdc > 0 && (
          <div className="mt-6 rounded-xl border border-emerald-600/30 bg-emerald-50/60 p-5 text-xs shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-emerald-800 font-bold">
                  Demo Asset Holding
                </div>
                <div className="mt-1 text-2xl font-black text-emerald-950">
                  ${currentHolding.amountUsdc.toLocaleString()} mockUSDC (
                  {((currentHolding.amountUsdc / target) * 100).toFixed(2)}%
                  Pool Share)
                </div>
                <p className="mt-0.5 text-emerald-800">
                  Yield streaming continuously from metered energy generation at{' '}
                  {demo.financials.projectedApy}% APY.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="block font-mono text-[10px] text-emerald-700 font-semibold">
                    Simulated Dividend
                  </span>
                  <span className="font-mono text-xl font-extrabold text-emerald-800">
                    +${accruedUsdc.toFixed(4)} mockUSDC
                  </span>
                </div>
                <a
                  href="#trees"
                  className="rounded-xl bg-forest px-4 py-2.5 font-bold text-white hover:bg-[#23573e] transition-colors shadow-sm text-xs"
                >
                  View on-chain rewards
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ALLOCATION INPUT AND PROPORTIONAL BREAKDOWN */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: Input & Allocation Controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-forest">
                Investment Amount (mockUSDC)
              </label>
              <div className="relative mt-1.5">
                <input
                  type="number"
                  min="10"
                  step="50"
                  value={investAmount}
                  onChange={(e) =>
                    setInvestAmount(
                      Math.max(0, parseFloat(e.target.value) || 0),
                    )
                  }
                  className="w-full rounded-xl border border-forest/20 bg-white px-4 py-3 font-mono text-xl font-extrabold text-forest focus:border-forest focus:outline-none shadow-xs"
                />
                <span className="absolute right-4 top-3.5 font-mono text-xs font-bold text-forest/50">
                  mockUSDC
                </span>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap gap-2">
              {[100, 250, 500, 1000, 2500].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setInvestAmount(amt)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition font-mono ${
                    investAmount === amt
                      ? 'border-forest bg-forest text-white'
                      : 'border-forest/15 bg-white text-forest hover:bg-forest/5'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleInvest}
              disabled={investAmount <= 0}
              className="w-full rounded-xl bg-forest py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#23573e] disabled:opacity-50"
            >
              Fund ${investAmount.toLocaleString()} mockUSDC in this Asset →
            </button>

            {justInvested && (
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800">
                <CheckIcon className="h-4 w-4" />
                Successfully allocated ${investAmount.toLocaleString()}{' '}
                mockUSDC!
              </div>
            )}
          </div>

          {/* Right: Proportional Distribution Table */}
          <div className="rounded-xl border border-forest/15 bg-cream/40 p-5 text-xs shadow-xs">
            <span className="font-mono text-[10px] text-emerald-800 font-bold uppercase tracking-wider">
              Exact Distribution for ${investAmount.toLocaleString()} mockUSDC
            </span>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between border-b border-forest/10 pb-2.5">
                <span className="text-forest/70 font-medium">
                  Hardware Ownership Stake:
                </span>
                <span className="font-mono font-bold text-forest text-sm">
                  {poolSharePercent}% of Pool
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-forest/10 pb-2.5">
                <span className="text-forest/70 font-medium">
                  Daily Energy Dividend:
                </span>
                <span className="font-mono font-bold text-emerald-800 text-sm">
                  +${dailyDividend} / day
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-forest/10 pb-2.5">
                <span className="text-forest/70 font-medium">
                  Monthly Run-Rate:
                </span>
                <span className="font-mono font-bold text-emerald-800 text-sm">
                  +${monthlyDividend} / mo
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="font-bold text-forest text-sm">
                  Annual Distributed Yield:
                </span>
                <span className="font-mono text-xl font-black text-emerald-800">
                  +${annualDividend} / yr
                </span>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-forest/10 bg-white p-3 text-[11px] text-forest/70 leading-snug">
              <strong>Yield Distribution Rule:</strong> For every kilowatt-hour
              metered by this Victron installation, revenue is split
              proportionally according to token share. (${investAmount} ×{' '}
              {demo.financials.projectedApy}%) = ${annualDividend} annual
              return.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
