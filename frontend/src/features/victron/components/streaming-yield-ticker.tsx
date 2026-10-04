import { useState, useEffect } from 'react';

export interface StreamingYieldTickerProps {
  assetName: string;
  shareUsdc?: number;
  stakePercent: string;
  hourlyRate: string;
  baseYieldUsdc?: number;
  incrementPerSecond?: number;
}

export function StreamingYieldTicker({
  assetName,
  shareUsdc = 100,
  stakePercent,
  hourlyRate,
  baseYieldUsdc = 0.035,
  incrementPerSecond = 0.0012,
}: StreamingYieldTickerProps) {
  const [liveCents, setLiveCents] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveCents((prev) => prev + incrementPerSecond);
    }, 1000);
    return () => clearInterval(timer);
  }, [incrementPerSecond]);

  const totalClaimable = (baseYieldUsdc + liveCents).toFixed(4);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-forest/15 bg-forest text-white p-3 px-4 font-mono text-xs shadow-xs">
      <div className="flex items-center gap-2.5">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
        <span className="font-bold text-cream">
          Investor Position ({shareUsdc} USDC Share):
        </span>
        <span className="text-white/80">
          {assetName} Stake {stakePercent} · Continuous Settlement Active
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div>
          <span className="text-white/60 text-[11px]">Unclaimed Yield: </span>
          <span className="font-bold text-emerald-300 text-sm">
            +${totalClaimable} USDC
          </span>
        </div>
        <span className="rounded bg-emerald-700/60 px-2 py-0.5 text-[10px] text-emerald-200">
          {hourlyRate}
        </span>
      </div>
    </div>
  );
}
