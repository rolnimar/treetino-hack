import type { VictronDemoItem } from '../victron-types';
import { CloudIcon } from '../victron-icons';

export interface InstallationHeaderProps {
  demo: VictronDemoItem;
  flowMode: 'both' | 'power' | 'funds';
  onFlowModeChange: (mode: 'both' | 'power' | 'funds') => void;
  titleOverride?: string;
  badgeOverride?: string;
}

export function InstallationHeader({
  demo,
  flowMode,
  onFlowModeChange,
  titleOverride,
  badgeOverride,
}: InstallationHeaderProps) {
  const { title, categoryBadge, siteId, location, narrative, liveWeather } =
    demo;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-5">
      <div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold tracking-[0.2em] text-t-blue uppercase">
            {badgeOverride || `${categoryBadge} · Site #${siteId}`}
          </span>
        </div>
        <h3 className="mt-1 text-2xl font-extrabold tracking-tight text-zinc-950 sm:text-3xl">
          {titleOverride || title}
        </h3>
        <p className="text-xs text-zinc-500 max-w-3xl mt-1 leading-relaxed">
          {location.city}, {location.country} · {narrative}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Flow Mode Switcher */}
        <div className="flex items-center rounded-xl border border-black/10 bg-zinc-50 p-1 font-mono text-xs">
          <button
            type="button"
            onClick={() => onFlowModeChange('power')}
            className={`rounded-lg px-3 py-1 font-semibold transition cursor-pointer ${
              flowMode === 'power'
                ? 'bg-t-blue text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            Energy Flow
          </button>
          <button
            type="button"
            onClick={() => onFlowModeChange('funds')}
            className={`rounded-lg px-3 py-1 font-semibold transition cursor-pointer ${
              flowMode === 'funds'
                ? 'bg-t-blue text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            Fund Flow
          </button>
          <button
            type="button"
            onClick={() => onFlowModeChange('both')}
            className={`rounded-lg px-3 py-1 font-semibold transition cursor-pointer ${
              flowMode === 'both'
                ? 'bg-t-blue text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            Unified
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-black/10 bg-zinc-50 px-3.5 py-1.5 text-xs text-zinc-700 font-mono">
          <CloudIcon className="h-4 w-4 text-zinc-400" />
          <span className="font-bold">
            {liveWeather
              ? `${liveWeather.tempCelsius} °C ${liveWeather.condition}`
              : '18 °C Partly Cloudy'}
          </span>
        </div>
      </div>
    </div>
  );
}
