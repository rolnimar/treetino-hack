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
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-forest/10 pb-5">
      <div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 animate-pulse" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-800">
            {badgeOverride || `${categoryBadge} · Site #${siteId}`}
          </span>
        </div>
        <h3 className="mt-1 text-2xl font-extrabold tracking-tight text-forest sm:text-3xl">
          {titleOverride || title}
        </h3>
        <p className="text-xs text-forest/70 max-w-3xl mt-1">
          {location.city}, {location.country} · {narrative}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Flow Mode Switcher */}
        <div className="flex items-center rounded-xl border border-forest/15 bg-cream/50 p-1 font-mono text-xs">
          <button
            type="button"
            onClick={() => onFlowModeChange('power')}
            className={`rounded-lg px-2.5 py-1 font-bold transition cursor-pointer ${
              flowMode === 'power'
                ? 'bg-forest text-white shadow-xs'
                : 'text-forest/70 hover:text-forest'
            }`}
          >
            Energy Flow
          </button>
          <button
            type="button"
            onClick={() => onFlowModeChange('funds')}
            className={`rounded-lg px-2.5 py-1 font-bold transition cursor-pointer ${
              flowMode === 'funds'
                ? 'bg-forest text-white shadow-xs'
                : 'text-forest/70 hover:text-forest'
            }`}
          >
            Fund Flow
          </button>
          <button
            type="button"
            onClick={() => onFlowModeChange('both')}
            className={`rounded-lg px-2.5 py-1 font-bold transition cursor-pointer ${
              flowMode === 'both'
                ? 'bg-forest text-white shadow-xs'
                : 'text-forest/70 hover:text-forest'
            }`}
          >
            Unified
          </button>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-forest/15 bg-cream/50 px-3.5 py-1.5 text-xs text-forest font-mono">
          <CloudIcon className="h-4 w-4 text-forest/60" />
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
