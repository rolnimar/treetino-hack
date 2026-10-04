import { useState } from 'react';
import type { VictronDemoItem } from '../victron-types';
import {
  BatteryIcon,
  PowerPlugIcon,
  GridIcon,
  FroniusIcon,
} from '../victron-icons';
import {
  InstallationHeader,
  FlowSummaryBanner,
  StreamingYieldTicker,
  TelemetrySidepanel,
  CashFlowDossier,
  SchematicCard,
  ConduitLine,
} from '../components';

interface EssLayoutProps {
  demo: VictronDemoItem;
}

export function EssLayout({ demo }: EssLayoutProps) {
  const [flowMode, setFlowMode] = useState<'both' | 'power' | 'funds'>('both');

  const { currentPower, dailyTotals, financials } = demo;

  // Financial rates
  const spotArbitrageSpread = 0.28; // €0.28 / kWh spread
  const annualPoolDistribution = (
    financials.targetUsdc *
    (financials.projectedApy / 100)
  ).toLocaleString();
  const dailyDisplacedSavings = (
    dailyTotals.solarYieldKwh * 0.32 +
    dailyTotals.gridExportKwh * spotArbitrageSpread
  ).toFixed(2);

  const isGridExporting = (currentPower.gridWatts ?? 0) <= 0;

  const essentialTrend = [280, 290, 310, 305, currentPower.consumptionWatts];
  const batteryTrend = [45, 38, 32, 28, currentPower.batterySocPercent];
  const solarTrend = demo.hourlyData.map((d) => d.solarKwh);

  return (
    <div className="rounded-2xl border border-forest/15 bg-white/95 p-5 shadow-sm sm:p-7 space-y-6">
      {/* 1. REUSABLE INSTALLATION HEADER */}
      <InstallationHeader
        demo={demo}
        flowMode={flowMode}
        onFlowModeChange={setFlowMode}
      />

      {/* 2. REUSABLE FLOW SUMMARY BANNER */}
      <FlowSummaryBanner
        generation={{
          label: 'Grid-Tied Solar Generation',
          value: `${dailyTotals.solarYieldKwh.toFixed(2)} kWh Today`,
          subtext: `Live PV yield: ${currentPower.solarYieldWatts.toFixed(0)} W`,
        }}
        consumption={{
          label: 'Facility Consumption',
          value: `${currentPower.consumptionWatts.toFixed(0)} W`,
          subtext: `Today: ${dailyTotals.consumptionKwh.toFixed(2)} kWh metered`,
        }}
        revenueOrSavings={{
          label: 'Peak Arbitrage & Balancing',
          value: `+$${dailyDisplacedSavings} / day`,
          subtext: 'Spot spread (€0.28/kWh) + frequency reserve',
        }}
        investorYield={{
          apyPercent: financials.projectedApy,
          annualDistribution: annualPoolDistribution,
          subtext: 'Distributed continuously to BESS tokenholders on Solana',
        }}
      />

      {/* 3. REUSABLE STREAMING YIELD TICKER */}
      <StreamingYieldTicker
        assetName="Commercial ESS"
        stakePercent="0.20%"
        hourlyRate="+$0.024 / hr"
        baseYieldUsdc={0.038}
        incrementPerSecond={0.0012}
      />

      {/* 4. SCHEMATIC CANVAS + UNCOUPLED TELEMETRY SIDEPANEL */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* LEFT 9 COLS: ELECTRICAL CIRCUIT SCHEMATIC CANVAS */}
        <div className="xl:col-span-9 overflow-x-auto rounded-2xl border border-forest/15 bg-[#fbfaf7] p-3 sm:p-5 flex items-center">
          <svg
            viewBox="0 0 770 420"
            className="w-full h-auto min-w-[680px] select-none"
          >
            {/* CONDUIT PIPES */}
            {/* Pipe 1: Grid Meter (240, 110) -> MultiPlus Hub (320, 110) */}
            <ConduitLine
              x1={240}
              y1={110}
              x2={320}
              y2={110}
              flow={
                flowMode !== 'funds'
                  ? isGridExporting
                    ? 'emerald'
                    : 'reverse-rose'
                  : null
              }
              fundsFlow={
                flowMode === 'funds' || flowMode === 'both' ? 'gold' : null
              }
            />

            {/* Pipe 2: MultiPlus Hub (490, 110) -> AC Loads (560, 110) */}
            <ConduitLine
              x1={490}
              y1={110}
              x2={560}
              y2={110}
              flow={
                flowMode !== 'funds' && currentPower.consumptionWatts > 0
                  ? 'rose'
                  : null
              }
              fundsFlow={
                flowMode === 'funds' || flowMode === 'both'
                  ? 'reverse-gold'
                  : null
              }
            />

            {/* Pipe 3: MultiPlus Hub bottom (405, 190) -> DC Bus (405, 310) */}
            <ConduitLine
              x1={405}
              y1={190}
              x2={405}
              y2={310}
              flow={flowMode !== 'funds' ? 'reverse-emerald' : null}
            />

            {/* Pipe 4: Battery Storage (240, 310) -> DC Bus (405, 310) */}
            <ConduitLine
              x1={240}
              y1={310}
              x2={405}
              y2={310}
              flow={flowMode !== 'funds' ? 'reverse-emerald' : null}
              fundsFlow={
                flowMode === 'funds' || flowMode === 'both' ? 'gold' : null
              }
            />

            {/* Pipe 5: DC Bus (405, 310) -> PV Inverter (560, 310) */}
            <ConduitLine
              x1={405}
              y1={310}
              x2={560}
              y2={310}
              flow={
                flowMode !== 'funds' && currentPower.solarYieldWatts > 0
                  ? 'amber'
                  : null
              }
              fundsFlow={
                flowMode === 'funds' || flowMode === 'both' ? 'gold' : null
              }
            />

            {/* Central DC Bus T-Junction Node */}
            <circle
              cx="405"
              cy="310"
              r="8"
              fill="#059669"
              stroke="#ffffff"
              strokeWidth="3"
            />

            {/* HARDWARE NODES */}
            {/* Card 1.1: GRID METER (Carlo Gavazzi ET340) */}
            <SchematicCard
              x={30}
              y={30}
              accent="forest"
              icon={<GridIcon className="h-4 w-4 text-forest/70" />}
              title="Grid Meter"
              badge="Carlo Gavazzi"
              primaryValue={
                isGridExporting
                  ? `${Math.abs(currentPower.gridWatts || 27)} W Export`
                  : `${currentPower.gridWatts} W Import`
              }
              subtext="Dynamic Bi-directional Feed"
              footerLabel="Spot Arbitrage:"
              footerValue="+€0.28 / kWh spread"
            />

            {/* Card 1.2: MULTIPLUS-II ESS INVERTER HUB */}
            <foreignObject x={320} y={30} width={170} height={160}>
              <div className="h-full w-full rounded-2xl border-2 border-forest/20 bg-cream/90 shadow-md flex flex-col justify-between overflow-hidden text-center select-none">
                <div className="bg-forest py-2 text-white">
                  <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 font-mono text-xs font-black">
                    ESS
                  </div>
                  <div className="mt-1 font-mono text-[10px] font-bold tracking-tight text-white/90">
                    MultiPlus-II 48V
                  </div>
                </div>
                <div className="p-2 flex flex-col items-center justify-center">
                  <span className="rounded-full bg-forest/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-forest">
                    Mode: {demo.systemInfo.systemState}
                  </span>
                  <div className="mt-1 font-mono text-xs font-extrabold text-emerald-800">
                    {financials.projectedApy}% APY Yield
                  </div>
                </div>
                <div className="bg-white/80 py-1 font-mono text-[9px] text-forest/60 border-t border-forest/10">
                  Grid Balancing Hub
                </div>
              </div>
            </foreignObject>

            {/* Card 1.3: AC LOADS (Critical Loads) */}
            <SchematicCard
              x={560}
              y={30}
              accent="rose"
              icon={<PowerPlugIcon className="h-4 w-4 text-rose-700" />}
              title="Critical Loads"
              badge="AC Out"
              primaryValue={`${currentPower.consumptionWatts.toFixed(0)} W`}
              subtext={`Today: ${dailyTotals.consumptionKwh.toFixed(2)} kWh`}
              sparklineData={essentialTrend.slice(-10)}
              footerLabel="Billing Velocity:"
              footerValue="+$0.10 / hr"
            />

            {/* Card 2.1: BATTERY STORAGE (Pylontech) */}
            <SchematicCard
              x={30}
              y={230}
              accent="emerald"
              icon={<BatteryIcon className="h-4 w-4 text-emerald-700" />}
              title="Battery Storage"
              badge="Pylontech 48V"
              primaryValue={`${currentPower.batterySocPercent.toFixed(1)} %`}
              subtext="48.54 V · Discharging (-348 W)"
              sparklineData={batteryTrend}
              progressPercent={currentPower.batterySocPercent}
              footerLabel="Capacity:"
              footerValue="14.4 kWh LFP Bank"
            />

            {/* Card 2.3: PV INVERTER (Fronius Primo) */}
            <SchematicCard
              x={560}
              y={230}
              accent="amber"
              icon={<FroniusIcon className="h-4 w-4" />}
              title="PV Inverter"
              badge="Fronius Primo"
              primaryValue={`${currentPower.solarYieldWatts.toFixed(0)} W`}
              subtext={`Harvested: ${dailyTotals.solarYieldKwh.toFixed(2)} kWh`}
              sparklineData={solarTrend.slice(-10)}
              footerLabel="Solar Yield:"
              footerValue={`+$${dailyDisplacedSavings} today`}
            />
          </svg>
        </div>

        {/* RIGHT 3 COLS: UNIFIED UNCOUPLED TELEMETRY SIDEPANEL */}
        <div className="xl:col-span-3">
          <TelemetrySidepanel
            demo={demo}
            specialtyTitle="Grid Arbitrage"
            specialtyBadge="ESS BESS"
            specialtyContent={
              <div className="space-y-1.5 text-[10px] font-mono text-forest/80">
                <div className="flex justify-between items-center">
                  <span>Spot Arbitrage Spread:</span>
                  <strong className="text-emerald-800 text-xs">
                    €0.28 / kWh spread
                  </strong>
                </div>
                <div className="text-forest/60">
                  Dynamic wholesale day-ahead market arbitrage
                </div>
                <div className="border-t border-forest/10 pt-1 flex justify-between items-center text-forest/60">
                  <span>Frequency Balancing:</span>
                  <span className="font-bold text-emerald-800">
                    Active Reserve
                  </span>
                </div>
              </div>
            }
          />
        </div>
      </div>

      {/* 5. REUSABLE COMMERCIAL DOSSIER & CASH FLOW WATERFALL */}
      <CashFlowDossier
        offTakerTitle="Industrial & Grid Balancing Operator"
        offTakerBadge="Dual-Market PPA"
        offTakerDescription="Commercial facility in Almere, Netherlands with smart battery energy storage system (BESS). Monetizes grid frequency regulation, peak shaving, and day-ahead wholesale energy arbitrage via automated algorithmic bidding."
        keyDetails={[
          {
            label: 'Balancing Spread',
            value: '€0.28 / kWh',
            subtext: 'Peak discharge margin',
          },
          {
            label: 'Frequency Reward',
            value: '€45 / MW / h',
            subtext: 'Transmission reserve',
          },
        ]}
        grossRevenueTitle="$7,100.00 / Year Gross Revenue"
        waterfallSteps={financials.cashFlowWaterfall}
      />
    </div>
  );
}
