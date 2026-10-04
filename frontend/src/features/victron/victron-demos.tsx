import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { ErrorMessage } from '../../components/ui/feedback';
import { useConnectedWallet } from '../wallet/use-connected-wallet';
import { useVictronInvestments } from './use-victron-investments';
import {
  type VictronDemoItem,
  victronDemosResponseSchema,
} from './victron-types';
import {
  SunIcon,
  BatteryIcon,
  PowerPlugIcon,
  ArrowRightIcon,
  CheckIcon,
  WindIcon,
} from './victron-icons';

interface VictronDemosProps {
  onSelectAsset?: (siteId: number) => void;
}

export function VictronDemos({ onSelectAsset }: VictronDemosProps) {
  const wallet = useConnectedWallet();
  const { investments } = useVictronInvestments(wallet?.address);

  const query = useQuery({
    queryKey: ['victron-energy-assets-v3'],
    queryFn: ({ signal }) =>
      api('victron/demos', victronDemosResponseSchema, { signal }),
    refetchInterval: 15_000,
  });

  const handleSelect = (siteId: number) => {
    onSelectAsset?.(siteId);
  };

  return (
    <section
      id="victron-demos"
      aria-label="Clean Energy Investment Assets"
      className="py-6"
    >
      {/* Section Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            <span className="font-mono text-xs font-semibold text-emerald-800 tracking-wider uppercase">
              Victron Energy · Verified Hardware DePIN
            </span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-forest sm:text-3xl">
            Real-World Clean Energy Assets
          </h2>
          <p className="mt-1 max-w-2xl text-xs text-forest/75 sm:text-sm">
            Live telemetry and automated investor cash flows streaming directly
            from Victron Cerbo GX gateways. Click any installation to open its
            dedicated electrical topology and calculate your dividend share.
          </p>
        </div>

        <button
          type="button"
          disabled={query.isFetching}
          onClick={() => void query.refetch()}
          className="rounded-xl border border-forest/20 bg-white px-4 py-2 text-xs font-bold text-forest hover:bg-forest/5 transition-colors disabled:opacity-50 shadow-xs"
        >
          {query.isFetching ? 'Syncing Hardware…' : 'Sync Telemetry'}
        </button>
      </div>

      <ErrorMessage error={query.error} />

      {query.isPending && (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-88 animate-pulse rounded-2xl bg-forest/5 p-6"
            />
          ))}
        </div>
      )}

      {query.data && (
        <>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {query.data.demos.map((demo) => (
              <CleanModernCard
                key={demo.siteId}
                demo={demo}
                holdingAmount={investments[demo.siteId]?.amountUsdc}
                onSelect={() => handleSelect(demo.siteId)}
              />
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-forest/60 font-mono">
            <span>
              Telemetry Source: <strong>Cerbo GX & Venus OS</strong> via Victron
              VRM
            </span>
            <span>
              Last hardware sync:{' '}
              {new Date(query.data.updatedAt).toLocaleTimeString()}
            </span>
          </div>
        </>
      )}
    </section>
  );
}

function CleanModernCard({
  demo,
  holdingAmount,
  onSelect,
}: {
  demo: VictronDemoItem;
  holdingAmount?: number;
  onSelect: () => void;
}) {
  const { currentPower, financials, location } = demo;

  return (
    <article
      onClick={onSelect}
      className="group relative flex flex-col justify-between rounded-2xl border border-forest/15 bg-white p-6 shadow-sm transition-all duration-200 hover:border-forest/40 hover:shadow-md cursor-pointer"
    >
      <div>
        {/* Top Header Row */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] font-bold tracking-wider text-forest/60 uppercase">
            {demo.categoryBadge}
          </span>
          <span className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Cerbo GX Live
          </span>
        </div>

        {/* Title & Location */}
        <h3 className="text-xl font-bold tracking-tight text-forest group-hover:text-leaf transition-colors">
          {demo.title}
        </h3>
        <p className="mt-0.5 text-xs text-forest/60">
          {location?.city ?? 'Site'}, {location?.country ?? ''}
        </p>

        {/* Financial Highlights */}
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-forest/5 p-4">
          <div>
            <span className="block text-[11px] font-semibold text-forest/60">
              Projected Yield
            </span>
            <span className="font-mono font-extrabold text-2xl text-emerald-800 tracking-tight">
              {financials.projectedApy}% APY
            </span>
          </div>
          <div>
            <span className="block text-[11px] font-semibold text-forest/60">
              Annual Revenue
            </span>
            <span className="font-mono font-bold text-base text-forest">
              ${financials.estAnnualRevenueUsdc.toLocaleString()} / yr
            </span>
          </div>
        </div>

        {/* Real-Time Power Flow Glance (Clean SVG Icons) */}
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-forest/10 bg-cream/30 p-2.5 text-xs">
          <div className="flex items-center gap-1.5">
            <SunIcon className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <div>
              <span className="block text-[10px] text-forest/50">Solar</span>
              <span className="font-mono font-bold text-forest text-xs">
                {currentPower.solarYieldWatts >= 1000
                  ? `${(currentPower.solarYieldWatts / 1000).toFixed(1)} kW`
                  : `${currentPower.solarYieldWatts.toFixed(0)} W`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {demo.key === 'treetino-v1' ? (
              <WindIcon className="h-3.5 w-3.5 text-sky-700 shrink-0" />
            ) : (
              <BatteryIcon className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
            )}
            <div>
              <span className="block text-[10px] text-forest/50">
                {demo.key === 'treetino-v1' ? 'Wind' : 'Battery'}
              </span>
              <span className="font-mono font-bold text-forest text-xs">
                {demo.key === 'treetino-v1'
                  ? `${((demo.windYieldWatts ?? 0) / 1000).toFixed(1)} kW`
                  : `${currentPower.batterySocPercent.toFixed(0)}%`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <PowerPlugIcon className="h-3.5 w-3.5 text-emerald-800 shrink-0" />
            <div>
              <span className="block text-[10px] text-forest/50">Load</span>
              <span className="font-mono font-bold text-forest text-xs">
                {currentPower.consumptionWatts >= 1000
                  ? `${(currentPower.consumptionWatts / 1000).toFixed(1)} kW`
                  : `${currentPower.consumptionWatts.toFixed(0)} W`}
              </span>
            </div>
          </div>
        </div>

        {/* Funding Progress Bar */}
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="text-forest/70 font-semibold">
              Target: ${financials.targetUsdc.toLocaleString()} USDC
            </span>
            <span className="font-mono font-bold text-leaf">
              {financials.fundedPercent}% funded
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-forest/10">
            <div
              className="h-full bg-leaf rounded-full transition-all duration-500"
              style={{ width: `${financials.fundedPercent}%` }}
            />
          </div>
        </div>

        {/* User Active Investment Badge if invested */}
        {holdingAmount && holdingAmount > 0 && (
          <div className="mt-3 flex items-center justify-between rounded-lg border border-emerald-600/30 bg-emerald-50 px-3 py-2 text-xs text-emerald-950">
            <span className="flex items-center gap-1.5 font-bold">
              <CheckIcon className="h-3.5 w-3.5 text-emerald-700" />
              Your Holding:
            </span>
            <span className="font-mono font-bold text-emerald-800">
              ${holdingAmount.toLocaleString()} mockUSDC
            </span>
          </div>
        )}
      </div>

      {/* Action Button: Clear, solid, high-contrast, always visible text */}
      <div className="mt-5 pt-3 border-t border-forest/10">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-[#23573e] hover:text-white active:scale-[0.99] group-hover:text-white"
        >
          <span className="text-white font-semibold">
            Open Installation & Invest
          </span>
          <ArrowRightIcon className="h-4 w-4 text-white shrink-0" />
        </button>
      </div>
    </article>
  );
}
