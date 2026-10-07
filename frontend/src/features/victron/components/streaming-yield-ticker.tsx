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
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 text-white p-3.5 px-5 font-mono text-xs shadow-md">
      <div className="flex items-center gap-2.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-semibold text-white">
          Active Position ({shareUsdc} USDC):
        </span>
        <span className="text-zinc-400">
          {assetName} · Stake {stakePercent}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div>
          <span className="text-zinc-400 text-[11px]">Unclaimed: </span>
          <span className="font-semibold text-emerald-400 text-sm">
            +${totalClaimable} USDC
          </span>
        </div>
        <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] text-zinc-300">
          {hourlyRate}
        </span>
      </div>
    </div>
  );
}
