import type { DossierQuickStat } from '../../types/investor-dossier';

interface DossierKeyMetricsProps {
  stats: DossierQuickStat[];
}

export function DossierKeyMetrics({ stats }: DossierKeyMetricsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className={`flex flex-col justify-between rounded-2xl border p-4 sm:p-5 transition ${
            stat.highlight
              ? 'border-t-blue/30 bg-t-blue/5 shadow-2xs'
              : 'border-black/10 bg-white shadow-2xs hover:border-black/20'
          }`}
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            {stat.label}
          </span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`font-mono text-xl sm:text-2xl font-black ${
                stat.highlight ? 'text-t-blue' : 'text-zinc-950'
              }`}
            >
              {stat.value}
            </span>
          </div>
          {stat.subtext && (
            <span className="mt-1 text-[11px] text-zinc-500 font-medium leading-tight">
              {stat.subtext}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
